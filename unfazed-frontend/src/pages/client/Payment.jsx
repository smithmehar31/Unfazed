import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

function Payment() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [client, setClient] = useState(null);
  const [therapist, setTherapist] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const [invoicePaymentId, setInvoicePaymentId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Client portal token is missing.");
      setLoading(false);
      return;
    }

    loadData();
  }, [token]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const portal = await axiosInstance.get(
        "/clients/portal/client",
        { params: { token } }
      );

      if (!portal.data?.success) {
        throw new Error(
          portal.data?.message ||
            "Unable to load client portal."
        );
      }

      const portalClient = portal.data.client;
      const portalTherapist = portal.data.therapist;

      setClient(portalClient);
      setTherapist(portalTherapist);

      const packageResponse = await axiosInstance.get(
        `/packages/public/${portalTherapist.slug}`
      );

      if (!packageResponse.data?.success) {
        throw new Error(
          packageResponse.data?.message ||
            "Unable to load packages."
        );
      }

      setPackages(packageResponse.data.packages || []);
    } catch (error) {
      console.error("Payment load error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
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

      const script = document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }

  async function handlePayment() {
    if (!selectedPackage) {
      setError("Please select a package first.");
      return;
    }

    try {
      setPaying(true);
      setError("");
      setSuccess("");
      setInvoicePaymentId("");

      const razorpayLoaded =
        await loadRazorpayScript();

      if (!razorpayLoaded) {
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
            package_id: selectedPackage._id,
          }
        );

      if (!orderResponse.data?.success) {
        throw new Error(
          orderResponse.data?.message ||
            "Unable to create payment order."
        );
      }

      const {
        order,
        payment,
        client: orderClient,
        package: orderPackage,
        razorpay_key_id,
      } = orderResponse.data;

      const razorpay = new window.Razorpay({
        key: razorpay_key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Unfazed",
        description: orderPackage.name,
        order_id: order.id,

        prefill: {
          name: orderClient.name,
          email: orderClient.email,
        },

        notes: {
          payment_id: String(payment.id),
          client_id: String(orderClient.id),
          package_id: String(orderPackage.id),
        },

        theme: {
          color: "#4d63d2",
        },

        handler: async (response) => {
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

            if (!verifyResponse.data?.success) {
              throw new Error(
                verifyResponse.data?.message ||
                  "Payment verification failed."
              );
            }

            const paymentId =
              verifyResponse.data.payment?.id;

            if (paymentId) {
              setInvoicePaymentId(paymentId);
            }

            setSuccess(
              "Payment completed and verified successfully."
            );
          } catch (error) {
            console.error(
              "Payment verification error:",
              error
            );

            setError(
              error.response?.data?.message ||
                error.message ||
                "Unable to verify payment."
            );
          } finally {
            setPaying(false);
          }
        },

        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      });

      razorpay.on(
        "payment.failed",
        async (response) => {
          const details = response?.error || {};

          setError(
            details.description ||
              "Payment failed. Please try again."
          );

          try {
            await axiosInstance.post(
              "/payments/packages/failed",
              {
                razorpay_order_id: order.id,
                razorpay_payment_id:
                  details.metadata?.payment_id || "",
                error_code: details.code || "",
                error_description:
                  details.description || "",
                error_reason: details.reason || "",
                error_source: details.source || "",
                error_step: details.step || "",
              }
            );
          } catch (failureError) {
            console.error(
              "Failed payment recording error:",
              failureError
            );
          }

          setPaying(false);
        }
      );

      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to start payment."
      );

      setPaying(false);
    }
  }

  function invoiceUrl() {
    if (!invoicePaymentId || !token) return "";

    return (
      `${import.meta.env.VITE_API_BASE_URL}` +
      `/payments/portal/invoice/${invoicePaymentId}` +
      `?token=${encodeURIComponent(token)}`
    );
  }

  function money(value) {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  }

  if (loading) {
    return (
      <>
        <style>{css}</style>

        <div className="payment-page">
          <div className="state-card">
            <div className="state-icon">₹</div>
            <h2>Loading payment options</h2>
            <p>
              Preparing available packages for you...
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!token || (error && !client)) {
    return (
      <>
        <style>{css}</style>

        <div className="payment-page">
          <div className="state-card">
            <div className="error-icon">!</div>
            <h2>Payment page unavailable</h2>
            <p>{error}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>

      <div className="payment-page">
        <div className="payment-shell">
          <header className="topbar">
            <div className="brand">
              <div className="brand-mark">U</div>

              <div>
                <strong>Unfazed</strong>
                <span>Secure client payment</span>
              </div>
            </div>

            <div className="client-chip">
              <span>Client</span>
              <strong>{client?.name}</strong>
            </div>
          </header>

          <section className="hero">
            <div>
              <div className="eyebrow light">
                PAYMENT
              </div>

              <h1>Choose a session package</h1>

              <p>
                Select a package from{" "}
                <strong>{therapist?.name}</strong> and
                continue to secure checkout.
              </p>
            </div>

            <div className="secure-badge">
              <span>✓</span>
              Secure Checkout
            </div>
          </section>

          {success && (
            <div className="notice success">
              <div className="notice-icon">✓</div>

              <div>
                <strong>Payment successful</strong>
                <p>{success}</p>

                {invoicePaymentId && (
                  <a
                    href={invoiceUrl()}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Invoice →
                  </a>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="notice error">
              <div className="notice-icon">!</div>
              <div>
                <strong>Payment issue</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {packages.length === 0 ? (
            <div className="empty-card">
              <div className="empty-icon">₹</div>
              <h2>No packages available</h2>
              <p>
                There are currently no active packages available
                for purchase.
              </p>
            </div>
          ) : (
            <>
              <section>
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">
                      AVAILABLE PACKAGES
                    </div>
                    <h2>Choose what works for you</h2>
                    <p>
                      Select one package below to continue.
                    </p>
                  </div>

                  <span>
                    {packages.length} option
                    {packages.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="package-grid">
                  {packages.map((item) => {
                    const selected =
                      selectedPackage?._id === item._id;

                    return (
                      <button
                        key={item._id}
                        type="button"
                        className={`package-card ${
                          selected ? "selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedPackage(item);
                          setError("");
                          setSuccess("");
                          setInvoicePaymentId("");
                        }}
                      >
                        {selected && (
                          <span className="selected-badge">
                            Selected
                          </span>
                        )}

                        <div className="package-top">
                          <div className="package-icon">
                            {item.session_count}
                          </div>

                          <div>
                            <div className="package-label">
                              SESSION PACKAGE
                            </div>

                            <h3>{item.name}</h3>
                          </div>
                        </div>

                        <div className="package-price">
                          {money(item.total_price)}
                        </div>

                        <div className="package-per">
                          {money(item.price_per_session)}
                          {" "}per session
                        </div>

                        <div className="package-details">
                          <div>
                            <span>Sessions</span>
                            <strong>
                              {item.session_count}
                            </strong>
                          </div>

                          <div>
                            <span>Validity</span>
                            <strong>
                              {item.validity_days} days
                            </strong>
                          </div>
                        </div>

                        <p className="package-description">
                          {item.description ||
                            "Flexible therapy session package."}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="checkout-card">
                <div>
                  <div className="eyebrow">
                    YOUR SELECTION
                  </div>

                  <h2>
                    {selectedPackage
                      ? selectedPackage.name
                      : "No package selected"}
                  </h2>

                  <p>
                    {selectedPackage
                      ? `${selectedPackage.session_count} sessions · valid for ${selectedPackage.validity_days} days`
                      : "Select a package above to continue to secure checkout."}
                  </p>
                </div>

                <div className="checkout-side">
                  {selectedPackage && (
                    <strong>
                      {money(
                        selectedPackage.total_price
                      )}
                    </strong>
                  )}

                  <button
                    type="button"
                    className="pay-btn"
                    onClick={handlePayment}
                    disabled={
                      !selectedPackage || paying
                    }
                  >
                    {paying
                      ? "Opening Checkout..."
                      : "Pay Now →"}
                  </button>
                </div>
              </section>
            </>
          )}

          <footer>
            <span>Unfazed</span>
            <span>
              Secure payments powered by Razorpay
            </span>
          </footer>
        </div>
      </div>
    </>
  );
}

const css = `
  .payment-page {
    min-height: 100vh;
    background: #f4f6fa;
    color: #192338;
    padding: 22px;
    font-family: Inter, system-ui, -apple-system,
      BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .payment-page * {
    box-sizing: border-box;
  }

  .payment-shell {
    max-width: 1040px;
    margin: 0 auto;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e1e6ef;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .brand-mark {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: #4d63d2;
    color: #fff;
    font-weight: 800;
  }

  .brand strong {
    display: block;
    color: #192338;
    font-size: 15px;
  }

  .brand span {
    display: block;
    color: #818b9b;
    font-size: 9px;
    margin-top: 2px;
  }

  .client-chip {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
  }

  .client-chip span {
    color: #8892a3;
    font-size: 9px;
  }

  .client-chip strong {
    color: #354158;
    font-size: 11px;
  }

  .hero {
    margin-top: 20px;
    padding: 27px;
    border-radius: 20px;
    background: linear-gradient(135deg,#24366f,#5269d7);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    color: #fff;
    box-shadow: 0 13px 29px rgba(44,58,125,.13);
  }

  .eyebrow {
    margin-bottom: 7px;
    color: #738097;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.6px;
  }

  .eyebrow.light {
    color: rgba(255,255,255,.7);
  }

  .hero h1 {
    margin: 0;
    color: #fff;
    font-size: 31px;
    letter-spacing: -.5px;
  }

  .hero p {
    margin: 8px 0 0;
    color: rgba(255,255,255,.8);
    font-size: 12px;
    line-height: 1.6;
  }

  .hero p strong {
    color: #fff;
  }

  .secure-badge {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
    padding: 9px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.18);
    background: rgba(255,255,255,.1);
    color: #fff;
    font-size: 9px;
    font-weight: 800;
  }

  .secure-badge span {
    width: 18px;
    height: 18px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #62bf84;
    color: #fff;
  }

  .notice {
    display: flex;
    gap: 11px;
    margin-top: 14px;
    padding: 13px;
    border-radius: 12px;
  }

  .notice.success {
    background: #edf9f2;
    border: 1px solid #d0e8d8;
  }

  .notice.error {
    background: #fff2f2;
    border: 1px solid #efd5d5;
  }

  .notice-icon {
    width: 29px;
    height: 29px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    background: #fff;
    font-weight: 800;
    flex-shrink: 0;
  }

  .notice.success .notice-icon {
    color: #318655;
  }

  .notice.error .notice-icon {
    color: #ad4545;
  }

  .notice strong {
    color: #2b354a;
    font-size: 11px;
  }

  .notice p {
    margin: 3px 0 5px;
    color: #768194;
    font-size: 10px;
    line-height: 1.5;
  }

  .notice a {
    color: #4d63d2;
    font-size: 10px;
    font-weight: 800;
    text-decoration: none;
  }

  .section-heading {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 15px;
    margin: 24px 0 13px;
  }

  .section-heading h2 {
    margin: 0;
    color: #222d42;
    font-size: 22px;
  }

  .section-heading p {
    margin: 5px 0 0;
    color: #7a8597;
    font-size: 10px;
  }

  .section-heading > span {
    color: #8290a2;
    font-size: 10px;
  }

  .package-grid {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 14px;
  }

  .package-card {
    position: relative;
    width: 100%;
    padding: 20px;
    border: 1px solid #e0e5ed;
    border-radius: 16px;
    background: #fff;
    text-align: left;
    color: #192338;
    cursor: pointer;
    box-shadow: 0 7px 20px rgba(22,31,54,.04);
    transition: .18s ease;
  }

  .package-card:hover {
    transform: translateY(-2px);
    border-color: #bfc9ed;
  }

  .package-card.selected {
    border: 2px solid #4d63d2;
    padding: 19px;
    background: #f8f9ff;
  }

  .selected-badge {
    position: absolute;
    top: 13px;
    right: 13px;
    padding: 5px 8px;
    border-radius: 999px;
    background: #4d63d2;
    color: #fff;
    font-size: 8px;
    font-weight: 800;
  }

  .package-top {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .package-icon {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 12px;
    background: #eef1ff;
    color: #5065cf;
    font-size: 14px;
    font-weight: 800;
  }

  .package-label {
    margin: 0 0 3px;
    color: #8490a1;
    font-size: 8px;
    letter-spacing: 1px;
    font-weight: 800;
  }

  .package-card h3 {
    margin: 0;
    color: #263148;
    font-size: 16px;
  }

  .package-price {
    margin-top: 18px;
    color: #172033;
    font-size: 27px;
    font-weight: 800;
  }

  .package-per {
    margin-top: 3px;
    color: #7c8798;
    font-size: 10px;
  }

  .package-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #edf0f4;
  }

  .package-details div {
    padding: 9px;
    border-radius: 9px;
    background: #f7f8fb;
  }

  .package-details span,
  .package-details strong {
    display: block;
  }

  .package-details span {
    color: #8b94a4;
    font-size: 8px;
  }

  .package-details strong {
    margin-top: 4px;
    color: #364157;
    font-size: 10px;
  }

  .package-description {
    margin: 12px 0 0;
    color: #6e798c;
    font-size: 10px;
    line-height: 1.5;
  }

  .checkout-card {
    margin-top: 19px;
    padding: 20px 22px;
    border: 1px solid #dfe5ed;
    border-radius: 17px;
    background: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    box-shadow: 0 8px 22px rgba(22,31,54,.04);
  }

  .checkout-card h2 {
    margin: 0;
    color: #202b40;
    font-size: 18px;
  }

  .checkout-card p {
    margin: 5px 0 0;
    color: #788294;
    font-size: 10px;
  }

  .checkout-side {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .checkout-side > strong {
    color: #202b40;
    font-size: 19px;
  }

  .pay-btn {
    border: 0;
    border-radius: 10px;
    background: #4d63d2;
    color: #fff;
    padding: 12px 18px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .pay-btn:disabled {
    background: #b8bfce;
    cursor: not-allowed;
  }

  .empty-card,
  .state-card {
    text-align: center;
    background: #fff;
    border: 1px solid #e0e5ed;
    border-radius: 17px;
    padding: 42px 20px;
  }

  .empty-card {
    margin-top: 20px;
  }

  .empty-icon,
  .state-icon,
  .error-icon {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    margin: 0 auto 12px;
    border-radius: 14px;
    background: #eef1ff;
    color: #5065ce;
    font-weight: 800;
  }

  .error-icon {
    background: #fff0f0;
    color: #b04747;
  }

  .empty-card h2,
  .state-card h2 {
    margin: 0 0 6px;
    color: #29344a;
    font-size: 19px;
  }

  .empty-card p,
  .state-card p {
    margin: 0;
    color: #7b8597;
    font-size: 11px;
  }

  .state-card {
    max-width: 450px;
    margin: 100px auto;
  }

  footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-top: 21px;
    padding: 15px 2px 0;
    border-top: 1px solid #e1e6ef;
    color: #8b95a5;
    font-size: 9px;
  }

  @media (max-width: 850px) {
    .package-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 650px) {
    .payment-page {
      padding: 15px;
    }

    .topbar,
    .hero,
    .checkout-card,
    footer {
      flex-direction: column;
      align-items: flex-start;
    }

    .client-chip {
      align-items: flex-start;
    }

    .hero {
      padding: 21px;
    }

    .hero h1 {
      font-size: 26px;
    }

    .secure-badge {
      align-self: flex-start;
    }

    .section-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .checkout-side {
      width: 100%;
      justify-content: space-between;
    }

    .checkout-side .pay-btn {
      flex: 1;
    }

    footer {
      gap: 7px;
    }
  }
`;
export default Payment;