const fetch = require("node-fetch")

exports.handler = async event => {
  // Get request's token
  const request = JSON.parse(event.body)

  // Validate that the request is coming from Snipcart
  const response = await fetch(
    `https://payment.snipcart.com/api/public/custom-payment-gateway/validate?publicToken=${request.publicToken}`
  )
  // Return a 404 if the request is not from Snipcart
  if (!response.ok)
    return {
      statusCode: 404,
      body: "not found",
    }

  // Create a payment method list
  let paymentMethodList = [
    {
      id: "xendit",
      name: "Xendit",
      iconUrl: "https://snipcart-xendit.netlify.app/xendit-logo.png",
      checkoutUrl: "https://snipcart-xendit.netlify.app/checkout",
    },
  ]

  // Return successful status code and available payment methods
  return {
    statusCode: 200,
    body: JSON.stringify(paymentMethodList),
  }
}
