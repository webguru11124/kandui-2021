import { navigate } from "@reach/router"
import cardValidator from "card-validator"
import React, { useEffect, useReducer, useState } from "react"
import { Helmet } from "react-helmet"
import { v4 as uuidv4 } from "uuid"
import Layout from "../components/layout"
import SEO from "../components/seo"

const Checkout = () => {
  const [price, setPrice] = useState(null)
  const [loading, setLoading] = useState(true)
  const sessionId = React.useRef(null)

  useEffect(() => {
    // Get snipcart public token from query string
    const publicToken = new URLSearchParams(window.location.search).get(
      "publicToken"
    )
    // Fetch payment session from API
    fetch(
      `https://payment.snipcart.com/api/public/custom-payment-gateway/payment-session?publicToken=${publicToken}`
    )
      .then(res => {
        setLoading(false)
        if (res.ok) {
          return res.json()
        } else {
          throw "not snipcart checkout"
        }
      })
      .then(data => {
        sessionId.current = data.id
        setPrice(data.invoice.amount)
      })
  }, [])

  // credit card form state handling

  const INITIAL_STATE = {
    name: "",
    card: "",
    month: "",
    year: "",
    cvv: "",
  }

  const reducer = (state, action) => {
    switch (action.type) {
      case "updateFieldValue":
        return { ...state, [action.field]: action.value }

      default:
        return INITIAL_STATE
    }
  }

  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const [error, setError] = useState("")
  const [btnDisabled, setBtnDisabled] = useState(false)

  const updateFieldValue = field => event => {
    dispatch({
      type: "updateFieldValue",
      field,
      value: event.target.value,
    })
  }

  // handle form data on form submission
  const processCard = e => {
    e.preventDefault()
    setBtnDisabled(true)
    // Get reference to Xendit.js
    const Xendit = window.Xendit

    // Set your client's Xendit public key here
    Xendit.setPublishableKey(
      "xnd_public_development_VZtcm4H4FFrahZHRqM3eWJIUDaGSQHhjAaYxB1YearHZzY7P6mxK9oMUlYREy"
    )

    // run card validation using library
    const number = cardValidator.number(state.card)
    if (!number.isValid) {
      setError("Card number not valid")
      setBtnDisabled(false)
      return undefined
    }
    const month = cardValidator.expirationMonth(state.month)
    if (!month.isValid) {
      setError("Card expiry month is not valid")
      setBtnDisabled(false)
      return undefined
    }
    const year = cardValidator.expirationYear(state.year)
    if (!year.isValid) {
      setError("Card expiry year is not valid")
      setBtnDisabled(false)
      return undefined
    }
    const cvv = cardValidator.cvv(state.cvv)
    if (!cvv.isValid) {
      setError("Card security code is not valid")
      setBtnDisabled(false)
      return undefined
    }

    // this is called by Xendit.js on response from Xendit server after tokenization request
    const xenditResponse = (err, res) => {
      // this error might not be relevant to users
      // if this is showing error it might be you messed up somewhere before this step
      if (err) {
        setError(err.message)
        setBtnDisabled(false)
        return undefined
      }
      if (res) {
        if (res.status === "VERIFIED") {
          // Get the token ID:
          const token = res.id
          // send token id from xendit and snipcart info to serverless function

          const transactionId = uuidv4()
          fetch("/.netlify/functions/payment", {
            method: "POST",
            body: JSON.stringify({
              paymentSessionId: sessionId.current,
              transactionId,
              state: "processed",
              error: null,
              xenditTokenId: token,
              amount: price,
            }),
          })
            .then(res => res.json())
            .then(body => {
              if (body.returnUrl) navigate(body.returnUrl)
            })
            .catch(err => console.log("err", err))
        } else if (res.status === "IN_REVIEW") {
          // FIX THIS
          window.open(res.payer_authentication_url, "sample-inline-frame")
        } else if (res.status === "FAILED") {
          // show failure reason and reenable form submission
          setError(res.failure_reason)
          setBtnDisabled(false)
        }
      }
    }

    // tokenize card information
    Xendit.card.createToken(
      {
        amount: price,
        card_number: state.card,
        card_exp_month: state.month,
        card_exp_year: state.year,
        card_cvn: state.cvn,
        is_multiple_use: false,
        should_authenticate: true,
      },
      xenditResponse
    )
  }

  return (
    <Layout>
      <Helmet>
        <script
          type="text/javascript"
          src="https://js.xendit.co/v1/xendit.min.js"
        ></script>
      </Helmet>
      <SEO title="Home" keywords={[`gatsby`, `application`, `react`]} />
      <div className="container">
        <div className="text-center mt-5">
          <h2 className="with-underline">Checkout Page</h2>
          {loading ? (
            ""
          ) : sessionId.current ? (
            <>
              <p>{price ? price : ""}</p>
              <form
                onSubmit={processCard}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  maxWidth: "500px",
                  margin: "0 auto 30px",
                }}
              >
                <label htmlFor="name">Enter cardholder name</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  onChange={updateFieldValue("name")}
                  required
                />
                <label htmlFor="card">Enter Credit Card Number</label>
                <input
                  type="number"
                  name="card"
                  id="card"
                  onChange={updateFieldValue("card")}
                  required
                />
                <label htmlFor="month">Enter Card Expiry Month</label>

                <input
                  type="number"
                  name="month"
                  id="month"
                  onChange={updateFieldValue("month")}
                  required
                />
                <label htmlFor="year">Enter Card Expiry Year</label>

                <input
                  type="number"
                  name="year"
                  id="year"
                  onChange={updateFieldValue("year")}
                  required
                />

                <label htmlFor="cvv">Enter Card cvv</label>
                <input
                  type="number"
                  name="cvv"
                  id="cvv"
                  onChange={updateFieldValue("cvv")}
                  required
                />
                <button disabled={btnDisabled}>Pay</button>
              </form>
              <p>{error}</p>
            </>
          ) : (
            <p>This page is for order. You haven't ordered anything</p>
          )}
        </div>
      </div>
    </Layout>
  )
}
export default Checkout
