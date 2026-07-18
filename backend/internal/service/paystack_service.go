package service

import (
	"context"
	"fmt"
	"os"

	"github.com/valentineejk/piple/internal/helpers"
)

const paystackBaseURL = "https://api.paystack.co"

func paystackAuthHeaders() map[string]string {
	return map[string]string{
		"Authorization": "Bearer " + os.Getenv("PAYSTACK_SECRET"),
	}
}

// paystackEnvelope
type paystackEnvelope[T any] struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    T      `json:"data"`
}

// Banks

type Bank struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
	Code string `json:"code"`
}

// GetBanks proxies Paystack List Banks.
func GetBanks(ctx context.Context, currency string) ([]Bank, error) {
	if currency == "" {
		currency = "NGN"
	}
	res, err := helpers.DoJSON[paystackEnvelope[[]Bank]](ctx, helpers.APIRequest{
		Method:  "GET",
		URL:     paystackBaseURL + "/bank",
		Headers: paystackAuthHeaders(),
		Query:   map[string]string{"currency": currency},
	})
	if err != nil {
		return nil, err
	}
	return res.Data, nil
}

type ResolvedAccount struct {
	AccountNumber string `json:"account_number"`
	AccountName   string `json:"account_name"`
}

// ResolveAccount
func ResolveAccount(ctx context.Context, accountNumber, bankCode string) (*ResolvedAccount, error) {
	res, err := helpers.DoJSON[paystackEnvelope[ResolvedAccount]](ctx, helpers.APIRequest{
		Method:  "GET",
		URL:     paystackBaseURL + "/bank/resolve",
		Headers: paystackAuthHeaders(),
		Query: map[string]string{
			"account_number": accountNumber,
			"bank_code":      bankCode,
		},
	})
	if err != nil {
		return nil, err
	}
	return &res.Data, nil
}

// Charge

type InitializeTxnResult struct {
	AuthorizationURL string `json:"authorization_url"`
	AccessCode       string `json:"access_code"`
	Reference        string `json:"reference"`
}

func InitializeTransaction(ctx context.Context, email string, amount int64, reference string) (*InitializeTxnResult, error) {
	body := map[string]any{"email": email, "amount": amount}
	if reference != "" {
		body["reference"] = reference
	}
	res, err := helpers.DoJSON[paystackEnvelope[InitializeTxnResult]](ctx, helpers.APIRequest{
		Method:  "POST",
		URL:     paystackBaseURL + "/transaction/initialize",
		Headers: paystackAuthHeaders(),
		Body:    body,
	})
	if err != nil {
		return nil, err
	}
	return &res.Data, nil
}

// success, failed, abandoned
type TransactionStatus struct {
	Reference string `json:"reference"`
	Status    string `json:"status"`
	Amount    int64  `json:"amount"`
	Channel   string `json:"channel"`
}

func VerifyTransaction(ctx context.Context, reference string) (*TransactionStatus, error) {
	res, err := helpers.DoJSON[paystackEnvelope[TransactionStatus]](ctx, helpers.APIRequest{
		Method:  "GET",
		URL:     fmt.Sprintf("%s/transaction/verify/%s", paystackBaseURL, reference),
		Headers: paystackAuthHeaders(),
	})
	if err != nil {
		return nil, err
	}
	return &res.Data, nil
}

//Transfers

type TransferRecipient struct {
	RecipientCode string `json:"recipient_code"`
}

func CreateTransferRecipient(ctx context.Context, name, accountNumber, bankCode string) (*TransferRecipient, error) {
	res, err := helpers.DoJSON[paystackEnvelope[TransferRecipient]](ctx, helpers.APIRequest{
		Method:  "POST",
		URL:     paystackBaseURL + "/transferrecipient",
		Headers: paystackAuthHeaders(),
		Body: map[string]any{
			"type":           "nuban",
			"name":           name,
			"account_number": accountNumber,
			"bank_code":      bankCode,
			"currency":       "NGN",
		},
	})
	if err != nil {
		return nil, err
	}
	return &res.Data, nil
}

type TransferResult struct {
	Reference    string `json:"reference"`
	TransferCode string `json:"transfer_code"`
	Status       string `json:"status"`
	Amount       int64  `json:"amount"`
}

func InitiateTransfer(ctx context.Context, recipientCode string, amount int64, reason, reference string) (*TransferResult, error) {
	body := map[string]any{
		"source":    "balance",
		"amount":    amount,
		"recipient": recipientCode,
		"reason":    reason,
	}
	if reference != "" {
		body["reference"] = reference
	}
	res, err := helpers.DoJSON[paystackEnvelope[TransferResult]](ctx, helpers.APIRequest{
		Method:  "POST",
		URL:     paystackBaseURL + "/transfer",
		Headers: paystackAuthHeaders(),
		Body:    body,
	})
	if err != nil {
		return nil, err
	}
	return &res.Data, nil
}

func VerifyTransfer(ctx context.Context, reference string) (*TransferResult, error) {
	res, err := helpers.DoJSON[paystackEnvelope[TransferResult]](ctx, helpers.APIRequest{
		Method:  "GET",
		URL:     fmt.Sprintf("%s/transfer/verify/%s", paystackBaseURL, reference),
		Headers: paystackAuthHeaders(),
	})
	if err != nil {
		return nil, err
	}
	return &res.Data, nil
}
