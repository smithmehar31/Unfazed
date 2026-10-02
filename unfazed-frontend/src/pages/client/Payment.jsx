import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

function Payment() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [therapist, setTherapist] = useState(null);
  const [client, setClient] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const [invoicePaymentId, setInvoicePaymentId] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Client portal token is missing.");
      setLoading(false);
      return;
    }

    loadPortalData();
  }, [token]);

  async function loadPortalData() {
    try {
      setLoading(true);
      setError("");

      const portalResponse =
        await axiosInstance.get(
          "/clients/portal/client",
          {
            params: {
              token,
            },
          }
        );

      if (!portalResponse.data.success) {
        setError(
          portalResponse.data.message ||
            "Unable to load client portal."
        );
        return;
      }

      const portalClient =
        portalResponse.data.client;

      const portalTherapist =
        portalResponse.data.therapist;

      setClient(portalClient);
      setTherapist(portalTherapist);

      const packageResponse =
        await axiosInstance.get(
          `/packages/public/${portalTherapist.slug}`
        );

      if (packageResponse.data.success) {
        setPackages(
          packageResponse.data.packages || []
        );
      } else {
        setError(
          packageResponse.data.message ||
            "Unable to load packages."
        );
      }
    } catch (error) {
      console.error(
        "Payment page load error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load payment information."
      );
    } finally {
      setLoading(false);
    }
  }

  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script =
        document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        resolve(true);
      };

      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(script);
    });
  }

  async function handlePayment() {
    if (!selectedPackage) {
      setError(
        "Please select a package first."
      );
      return;
    }

    try {
      setPaying(true);
      setError("");
      setSuccess("");
      setInvoicePaymentId("");

      const scriptLoaded =
        await loadRazorpayScript();

      if (!scriptLoaded) {
        setError(
          "Unable to load Razorpay Checkout. Please try again."
        );

        setPaying(false);
        return;
      }

      const orderResponse =
        await axiosInstance.post(
          "/payments/portal/packages/order",
          {
            token,
            package_id:
              selectedPackage._id,
          }
        );

      if (!orderResponse.data.success) {
        setError(
          orderResponse.data.message ||
            "Unable to create payment order."
        );

        setPaying(false);
        return;
      }

      const {
        order,
        payment,
        client: orderClient,
        package: orderPackage,
        razorpay_key_id,
      } = orderResponse.data;

      const options = {
        key: razorpay_key_id,

        amount: order.amount,

        currency: order.currency,

        name: "Unfazed",

        description:
          orderPackage.name,

        order_id: order.id,

        prefill: {
          name: orderClient.name,
          email: orderClient.email,
        },

        notes: {
          payment_id:
            String(payment.id),

          client_id:
            String(orderClient.id),

          package_id:
            String(orderPackage.id),
        },

        theme: {
          color: "#4d63d2",
        },

        handler: async function (
          response
        ) {
          try {
            setError("");

            const verifyResponse =
              await axiosInstance.post(
                "/payments/packages/verify",
                {
                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,
                }
              );

            if (
              verifyResponse.data.success
            ) {
              const verifiedPaymentId =
                verifyResponse.data
                  .payment?.id;

              if (verifiedPaymentId) {
                setInvoicePaymentId(
                  verifiedPaymentId
                );
              }

              setSuccess(
                "Payment completed and verified successfully."
              );
            } else {
              setError(
                verifyResponse.data
                  .message ||
                  "Payment verification failed."
              );
            }
          } catch (error) {
            console.error(
              "Payment verification error:",
              error
            );

            setError(
              error.response?.data
                ?.message ||
                "Unable to verify payment."
            );
          } finally {
            setPaying(false);
          }
        },

        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },
      };

      const razorpayCheckout =
        new window.Razorpay(options);

      razorpayCheckout.on(
        "payment.failed",
        async function (response) {
          console.error(
            "Razorpay payment failed:",
            response.error
          );

          setError(
            response.error
              ?.description ||
              "Payment failed. Please try again."
          );

          // Update the local payment record
          // so created -> failed.
          try {
            const failedResponse =
              await axiosInstance.post(
                "/payments/packages/failed",
                {
                  razorpay_order_id:
                    order.id,

                  razorpay_payment_id:
                    response.error
                      ?.metadata
                      ?.payment_id || "",

                  error_code:
                    response.error
                      ?.code || "",

                  error_description:
                    response.error
                      ?.description || "",

                  error_reason:
                    response.error
                      ?.reason || "",

                  error_source:
                    response.error
                      ?.source || "",

                  error_step:
                    response.error
                      ?.step || "",
                }
              );

            if (
              failedResponse.data.success
            ) {
              setError(
                "Payment failed. The failed payment has been recorded."
              );
            }
          } catch (failureRecordError) {
            console.error(
              "Failed payment recording error:",
              failureRecordError
            );

            // Keep the original payment failure message
            // visible to the client.
          }

          setPaying(false);
        }
      );

      razorpayCheckout.open();
    } catch (error) {
      console.error(
        "Payment error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to start payment."
      );

      setPaying(false);
    }
  }

  function getInvoiceUrl() {
    if (
      !invoicePaymentId ||
      !token
    ) {
      return "";
    }

    return (
      `${import.meta.env.VITE_API_BASE_URL}` +
      `/payments/portal/invoice/${invoicePaymentId}` +
      `?token=${encodeURIComponent(token)}`
    );
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <p style={styles.loadingText}>
            Loading payment options...
          </p>
        </div>
      </div>
    );
  }

  if (!token || (!client && error)) {
    return (
      <div style={styles.page}>
        <div style={styles.errorCard}>
          <h2 style={styles.errorTitle}>
            Payment page unavailable
          </h2>

          <p style={styles.errorText}>
            {error ||
              "Unable to load this payment page."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <div style={styles.brand}>
              Unfazed
            </div>

            <p style={styles.headerSubtitle}>
              Secure client payment
            </p>
          </div>

          <div style={styles.clientInfo}>
            <span>Client</span>

            <strong>
              {client?.name}
            </strong>
          </div>
        </header>

        <section style={styles.hero}>
          <p style={styles.smallLabel}>
            PAY FOR YOUR SESSIONS
          </p>

          <h1 style={styles.title}>
            Choose a package
          </h1>

          <p style={styles.subtitle}>
            Select a package from{" "}
            {therapist?.name} and continue
            to secure checkout.
          </p>
        </section>

        {success && (
          <div style={styles.successBanner}>
            <div style={styles.successIcon}>
              ✓
            </div>

            <div style={styles.successContent}>
              <strong>
                Payment successful
              </strong>

              <p>{success}</p>

              {invoicePaymentId && (
                <a
                  href={getInvoiceUrl()}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.invoiceButton}
                >
                  Download Invoice
                </a>
              )}
            </div>
          </div>
        )}

        {error && (
          <div style={styles.errorBanner}>
            {error}
          </div>
        )}

        {packages.length === 0 ? (
          <div style={styles.emptyCard}>
            <h2 style={styles.emptyTitle}>
              No active packages
            </h2>

            <p style={styles.emptyText}>
              There are currently no packages
              available for purchase.
            </p>
          </div>
        ) : (
          <>
            <div style={styles.packageGrid}>
              {packages.map((item) => {
                const selected =
                  selectedPackage?._id ===
                  item._id;

                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => {
                      setSelectedPackage(
                        item
                      );

                      setError("");
                      setSuccess("");
                      setInvoicePaymentId("");
                    }}
                    style={{
                      ...styles.packageCard,
                      ...(selected
                        ? styles.packageCardSelected
                        : {}),
                    }}
                  >
                    {selected && (
                      <span
                        style={
                          styles.selectedBadge
                        }
                      >
                        Selected
                      </span>
                    )}

                    <p
                      style={
                        styles.packageLabel
                      }
                    >
                      {item.session_count}{" "}
                      SESSIONS
                    </p>

                    <h2
                      style={
                        styles.packageName
                      }
                    >
                      {item.name}
                    </h2>

                    <div
                      style={styles.price}
                    >
                      ₹{item.total_price}
                    </div>

                    <p
                      style={
                        styles.perSession
                      }
                    >
                      ₹
                      {
                        item.price_per_session
                      }{" "}
                      per session
                    </p>

                    <div
                      style={
                        styles.packageDetails
                      }
                    >
                      <div>
                        <span>
                          Sessions
                        </span>

                        <strong>
                          {
                            item.session_count
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Validity
                        </span>

                        <strong>
                          {
                            item.validity_days
                          }{" "}
                          days
                        </strong>
                      </div>
                    </div>

                    <p
                      style={
                        styles.description
                      }
                    >
                      {item.description ||
                        "Flexible therapy sessions package."}
                    </p>
                  </button>
                );
              })}
            </div>

            <section
              style={
                styles.checkoutCard
              }
            >
              <div>
                <p
                  style={
                    styles.checkoutLabel
                  }
                >
                  SELECTED PACKAGE
                </p>

                <h2
                  style={
                    styles.checkoutTitle
                  }
                >
                  {selectedPackage
                    ? selectedPackage.name
                    : "No package selected"}
                </h2>

                <p
                  style={
                    styles.checkoutText
                  }
                >
                  {selectedPackage
                    ? `${selectedPackage.session_count} sessions · valid for ${selectedPackage.validity_days} days`
                    : "Select a package above to continue."}
                </p>
              </div>

              <div
                style={
                  styles.checkoutRight
                }
              >
                {selectedPackage && (
                  <strong
                    style={
                      styles.checkoutPrice
                    }
                  >
                    ₹
                    {
                      selectedPackage.total_price
                    }
                  </strong>
                )}

                <button
                  type="button"
                  onClick={
                    handlePayment
                  }
                  disabled={
                    !selectedPackage ||
                    paying
                  }
                  style={{
                    ...styles.payButton,
                    ...((!selectedPackage ||
                      paying)
                      ? styles.payButtonDisabled
                      : {}),
                  }}
                >
                  {paying
                    ? "Opening Checkout..."
                    : "Pay Now"}
                </button>
              </div>
            </section>
          </>
        )}

        <footer
          style={styles.footer}
        >
          Secure payments powered by
          Razorpay · Unfazed
        </footer>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#172033",
    padding: "30px 18px 60px",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    paddingBottom: "20px",
    borderBottom:
      "1px solid #e3e8ef",
  },

  brand: {
    color: "#4d63d2",
    fontSize: "22px",
    fontWeight: "800",
  },

  headerSubtitle: {
    margin: "4px 0 0",
    color: "#7c8697",
    fontSize: "11px",
  },

  clientInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "3px",
    color: "#788295",
    fontSize: "11px",
  },

  hero: {
    padding: "35px 0 25px",
  },

  smallLabel: {
    margin: "0 0 7px",
    color: "#788397",
    fontSize: "10px",
    letterSpacing: "1.4px",
    fontWeight: "800",
  },

  title: {
    margin: "0",
    color: "#172033",
    fontSize: "31px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#6d7788",
    fontSize: "14px",
    lineHeight: "1.6",
  },

  packageGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "16px",
  },

  packageCard: {
    position: "relative",
    textAlign: "left",
    border: "1px solid #dfe5ee",
    borderRadius: "17px",
    background: "#ffffff",
    padding: "22px",
    cursor: "pointer",
    color: "#172033",
    boxShadow:
      "0 8px 24px rgba(23,32,51,0.04)",
  },

  packageCardSelected: {
    border: "2px solid #4d63d2",
    background: "#f8f9ff",
  },

  selectedBadge: {
    position: "absolute",
    top: "14px",
    right: "14px",
    borderRadius: "20px",
    background: "#4d63d2",
    color: "#ffffff",
    padding: "4px 8px",
    fontSize: "9px",
    fontWeight: "800",
  },

  packageLabel: {
    margin: "0 0 7px",
    color: "#7b8597",
    fontSize: "10px",
    letterSpacing: "1px",
    fontWeight: "800",
  },

  packageName: {
    margin: "0",
    fontSize: "19px",
    color: "#202b3f",
  },

  price: {
    marginTop: "17px",
    color: "#172033",
    fontSize: "29px",
    fontWeight: "800",
  },

  perSession: {
    margin: "3px 0 0",
    color: "#717c8e",
    fontSize: "12px",
  },

  packageDetails: {
    marginTop: "18px",
    paddingTop: "14px",
    borderTop:
      "1px solid #edf0f4",
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "10px",
  },

  description: {
    margin: "15px 0 0",
    color: "#6e788b",
    fontSize: "12px",
    lineHeight: "1.55",
  },

  checkoutCard: {
    marginTop: "20px",
    background: "#ffffff",
    border: "1px solid #dfe5ee",
    borderRadius: "17px",
    padding: "20px 22px",
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    boxShadow:
      "0 8px 24px rgba(23,32,51,0.04)",
  },

  checkoutLabel: {
    margin: "0 0 5px",
    color: "#7c8697",
    fontSize: "9px",
    letterSpacing: "1.1px",
    fontWeight: "800",
  },

  checkoutTitle: {
    margin: "0",
    color: "#202b3f",
    fontSize: "18px",
  },

  checkoutText: {
    margin: "5px 0 0",
    color: "#747e8f",
    fontSize: "12px",
  },

  checkoutRight: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    flexShrink: 0,
  },

  checkoutPrice: {
    color: "#202b3f",
    fontSize: "20px",
  },

  payButton: {
    border: "none",
    borderRadius: "10px",
    background: "#4d63d2",
    color: "#ffffff",
    padding: "12px 20px",
    fontWeight: "700",
    cursor: "pointer",
  },

  payButtonDisabled: {
    background: "#b9c0cf",
    cursor: "not-allowed",
  },

  successBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    background: "#edf9f1",
    border: "1px solid #c4e5cc",
    borderRadius: "12px",
    padding: "13px 15px",
    marginBottom: "18px",
    color: "#34764a",
    fontSize: "13px",
  },

  successIcon: {
    width: "29px",
    height: "29px",
    borderRadius: "50%",
    background: "#2f9754",
    color: "#ffffff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "800",
    flexShrink: 0,
  },

  successContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "5px",
  },

  invoiceButton: {
    display: "inline-block",
    marginTop: "5px",
    background: "#34764a",
    color: "#ffffff",
    textDecoration: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: "700",
  },

  errorBanner: {
    background: "#fff1f1",
    border: "1px solid #eccaca",
    color: "#9e3535",
    borderRadius: "12px",
    padding: "12px 14px",
    marginBottom: "18px",
    fontSize: "13px",
  },

  emptyCard: {
    background: "#ffffff",
    border: "1px solid #e1e6ef",
    borderRadius: "17px",
    padding: "45px 20px",
    textAlign: "center",
  },

  emptyTitle: {
    margin: "0 0 8px",
    fontSize: "19px",
  },

  emptyText: {
    margin: "0",
    color: "#778194",
    fontSize: "13px",
  },

  loadingCard: {
    maxWidth: "450px",
    margin: "100px auto",
    background: "#ffffff",
    border: "1px solid #e1e6ef",
    borderRadius: "17px",
    padding: "35px",
    textAlign: "center",
  },

  loadingText: {
    margin: "0",
    color: "#707a8c",
  },

  errorCard: {
    maxWidth: "500px",
    margin: "100px auto",
    background: "#ffffff",
    border: "1px solid #e1e6ef",
    borderRadius: "17px",
    padding: "35px",
    textAlign: "center",
  },

  errorTitle: {
    margin: "0 0 8px",
    color: "#273249",
  },

  errorText: {
    margin: "0",
    color: "#707a8c",
    fontSize: "13px",
  },

  footer: {
    textAlign: "center",
    marginTop: "25px",
    color: "#8b94a2",
    fontSize: "10px",
  },
};

export default Payment;