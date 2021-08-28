var dotenv = require("dotenv")
dotenv.config()
const fetch = require("node-fetch")

exports.handler = async function(event) {
  // Retrieve payment information (depends on how your application is made)
  const requestBody = JSON.parse(event.body)

  // Process the payment with the gateway of your choice here

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
