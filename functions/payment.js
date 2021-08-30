var dotenv = require("dotenv")
dotenv.config()
const fetch = require("node-fetch")

exports.handler = async function(event) {
  // Retrieve payment information (depends on how your application is made)
  const requestBody = JSON.parse(event.body)

  // this key should never be on client side code. this is serverless function so its safe here
  // Dont forget to change this to yours
  const xenditSecretKey =
    "xnd_development_eqCZkBRK5NFf7IQrKawRshVG156og4tQUOiNTz8Sc5Cr0PTO1Isd6FPpRtXU0"

  // Payment processing with xendit
  fetch("https://api.xendit.co/credit_card_charges", {
    body: JSON.stringify({
      external_id: requestBody.transactionId,
      token_id: requestBody.xenditTokenId,
      amount: requestBody.amount,
    }),
    headers: {
      Authorization: `Basic ${xenditSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  })
  // Confirm payment with the /payment endpoint
  const response = await fetch(
    "https://payment.snipcart.com/api/private/custom-payment-gateway/payment",
    {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${process.env.SECRET_SNIPCART_APIKEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentSessionId: requestBody.paymentSessionId,
        state: requestBody.state,
        error: requestBody.error,
        transactionId: requestBody.transactionId,
        instructions:
          "Your payment will appear on your statement in the coming days",
      }),
    }
  )

  if (response.ok) {
    const body = await response.json()

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, returnUrl: body.returnUrl }),
    }
  }
}
