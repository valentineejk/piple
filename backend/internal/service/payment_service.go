package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	dbq "github.com/valentineejk/piple/db/sqlc"
)

//	request              -> CreatePaymentRequest
//	add money            -> InitiateWalletTopup      (Paystack InitializeTransaction)
//	approve/reject reason-> ApprovePaymentRequest / RejectPaymentRequest
//	credit               -> CreditWallet
//	debit                -> DebitWallet
//	get banks            -> GetBanks                 (paystack_service.go)
//	resolve banks        -> ResolveAccount           (paystack_service.go)
//	charge               -> InitiateWalletTopup / VerifyTransaction
//	verify               -> VerifyTransaction / VerifyTransfer
//	webhook              -> HandleWebhookEvent (+ VerifyWebhookSignature)
//	bank transfer        -> SendBankTransfer         (recipient + transfer)
//	payouts              -> RunPayouts
//	worker               -> RunSalaryWorker
//	tx                   -> RecordTransaction

type PaymentService struct {
	store *dbq.Store
}

func NewPaymentService(store *dbq.Store) *PaymentService {
	return &PaymentService{store: store}
}

var (
	ErrNotImplemented    = errors.New("not implemented")
	ErrInsufficientFunds = errors.New("insufficient wallet funds")
)

//Payment requests

type CreatePaymentRequestInput struct {
	RequestedBy   string
	Amount        int64 // kobo
	Description   string
	BankCode      string
	AccountNumber string
}

// CreatePaymentRequest records a procurement payment request (status: pending).
func (s *PaymentService) CreatePaymentRequest(ctx context.Context, in CreatePaymentRequestInput) error {
	// TODO: resolve the account name, then insert into payment_requests.
	return ErrNotImplemented
}

// ApprovePaymentRequest is the CEO approving a request; triggers a bank transfer.
func (s *PaymentService) ApprovePaymentRequest(ctx context.Context, requestID, reviewedBy string) error {
	// TODO: load request, set status=approved+reviewed_by/at, debit wallet,
	// SendBankTransfer, record transaction. Do the wallet mutation in a tx.
	return ErrNotImplemented
}

// RejectPaymentRequest is the CEO rejecting a request with a required reason.
func (s *PaymentService) RejectPaymentRequest(ctx context.Context, requestID, reviewedBy, reason string) error {
	if reason == "" {
		return errors.New("rejection reason is required")
	}
	// TODO: set status=rejected, rejection_reason, reviewed_by/at.
	return ErrNotImplemented
}

// Wallet

// LedgerEntry
type LedgerEntry struct {
	WalletID         pgtype.UUID
	UserID           pgtype.UUID // actor the ledger row is attributed to
	Amount           int64       // positive kobo
	Summary          string
	Provider         string      // e.g. "paystack"
	PayoutID         pgtype.UUID // optional
	PaymentRequestID pgtype.UUID // optional
}

// CreditWallet
func (s *PaymentService) CreditWallet(ctx context.Context, e LedgerEntry) (dbq.Wallet, error) {
	var wallet dbq.Wallet
	err := s.store.ExecTx(ctx, func(q *dbq.Queries) error {
		var err error
		wallet, err = q.CreditWallet(ctx, dbq.CreditWalletParams{ID: e.WalletID, Amount: e.Amount})
		if err != nil {
			return err
		}
		return recordTx(ctx, q, e, "credit")
	})
	return wallet, err
}

// DebitWallet
func (s *PaymentService) DebitWallet(ctx context.Context, e LedgerEntry) (dbq.Wallet, error) {
	var wallet dbq.Wallet
	err := s.store.ExecTx(ctx, func(q *dbq.Queries) error {
		var err error
		wallet, err = q.DebitWallet(ctx, dbq.DebitWalletParams{ID: e.WalletID, Amount: e.Amount})
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrInsufficientFunds
		}
		if err != nil {
			return err
		}
		return recordTx(ctx, q, e, "debit")
	})
	return wallet, err
}

// recordTx
func recordTx(ctx context.Context, q *dbq.Queries, e LedgerEntry, txType string) error {
	summary := optStr(e.Summary)
	provider := optStr(e.Provider)
	_, err := q.CreateTransaction(ctx, dbq.CreateTransactionParams{
		WalletID:         e.WalletID,
		UserID:           e.UserID,
		Amount:           e.Amount,
		Type:             txType,
		PayoutID:         e.PayoutID,
		PaymentRequestID: e.PaymentRequestID,
		Summary:          summary,
		Provider:         provider,
	})
	return err
}

func optStr(v string) *string {
	if v == "" {
		return nil
	}
	return &v
}

// Top-ups

type WalletTopupResult struct {
	Reference        string
	AuthorizationURL string
}

// InitiateWalletTopup
func (s *PaymentService) InitiateWalletTopup(ctx context.Context, initiatedBy, email string, amount int64) (*WalletTopupResult, error) {
	init, err := InitializeTransaction(ctx, email, amount, "")
	if err != nil {
		return nil, err
	}
	// TODO: INSERT INTO wallet_topups (initiated_by, amount, status=pending,
	//       paystack_reference=init.Reference).
	return &WalletTopupResult{
		Reference:        init.Reference,
		AuthorizationURL: init.AuthorizationURL,
	}, nil
}

// Bank transfer

// SendBankTransfer registers a recipient and initiates a Paystack transfer.
// Returns the transfer reference for reconciliation via webhook/verify.
func (s *PaymentService) SendBankTransfer(ctx context.Context, name, accountNumber, bankCode string, amount int64, reason string) (*TransferResult, error) {
	recipient, err := CreateTransferRecipient(ctx, name, accountNumber, bankCode)
	if err != nil {
		return nil, err
	}
	return InitiateTransfer(ctx, recipient.RecipientCode, amount, reason, "")
}

// Payouts

func (s *PaymentService) RunPayouts(ctx context.Context, payPeriod string) error {
	// TODO: for each active employee with a salary_code:
	//   - skip if a completed payout exists for payPeriod
	//   - create payout(status=pending)
	//   - DebitWallet(amount) or mark insufficient_funds
	//   - SendBankTransfer(...); update payout on webhook
	return ErrNotImplemented
}

// RetryPayout re-attempts a single failed payout transfer.
func (s *PaymentService) RetryPayout(ctx context.Context, payoutID string) error {
	// TODO: load failed payout, re-run the transfer step only.
	return ErrNotImplemented
}

// RunSalaryWorker is the entrypoint for the 28th-of-month cron that calls
// RunPayouts for the current period.
func (s *PaymentService) RunSalaryWorker(ctx context.Context) error {
	// TODO: derive current pay period, then RunPayouts.
	return ErrNotImplemented
}

// Webhook

type PaystackWebhookEvent struct {
	Event string          `json:"event"`
	Data  json.RawMessage `json:"data"`
}

// VerifyWebhookSignature
func VerifyWebhookSignature(body []byte, signature string) bool {
	mac := hmac.New(sha512.New, []byte(os.Getenv("PAYSTACK_SECRET")))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

// HandleWebhookEvent
func (s *PaymentService) HandleWebhookEvent(ctx context.Context, evt PaystackWebhookEvent) error {
	switch evt.Event {
	case "charge.success":
		// TODO: mark wallet_topup success + CreditWallet.
		return ErrNotImplemented
	case "charge.failed":
		// TODO: mark wallet_topup failed.
		return ErrNotImplemented
	case "transfer.success":
		// TODO: mark payout / payment_request completed.
		return ErrNotImplemented
	case "transfer.failed", "transfer.reversed":
		// TODO: mark failed and refund the wallet if already debited.
		return ErrNotImplemented
	default:
		return nil // ignore unrelated events
	}
}
