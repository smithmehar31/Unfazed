import { useCallback, useEffect, useState } from "react";

import axiosInstance from "../api/axiosInstance";

import { useAuth } from "../context/AuthContext";

function useEntitlement() {
  const { token } = useAuth();

  const [entitlements, setEntitlements] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [accessCache, setAccessCache] =
    useState({});

  // --------------------------------------------------
  // Fetch complete entitlement information
  // --------------------------------------------------
  const fetchEntitlements =
    useCallback(async () => {
      if (!token) {
        setEntitlements(null);
        setAccessCache({});
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await axiosInstance.get(
            "/entitlements/me",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        if (
          response.data?.success
        ) {
          setEntitlements(
            response.data.entitlements
          );
        } else {
          throw new Error(
            response.data?.message ||
              "Unable to load entitlements."
          );
        }
      } catch (requestError) {
        console.error(
          "Entitlement fetch error:",
          requestError
        );

        setEntitlements(null);

        setAccessCache({});

        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load subscription access."
        );
      } finally {
        setLoading(false);
      }
    }, [token]);

  // --------------------------------------------------
  // Fetch entitlements when token changes
  // --------------------------------------------------
  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  // --------------------------------------------------
  // Check one feature
  // --------------------------------------------------
  const checkAccess =
    useCallback(
      async (featureKey) => {
        if (!token) {
          return false;
        }

        if (!featureKey) {
          return false;
        }

        const normalizedFeatureKey =
          String(featureKey).trim();

        if (!normalizedFeatureKey) {
          return false;
        }

        // Return cached result when available
        if (
          Object.prototype.hasOwnProperty.call(
            accessCache,
            normalizedFeatureKey
          )
        ) {
          return accessCache[
            normalizedFeatureKey
          ];
        }

        try {
          const response =
            await axiosInstance.get(
              `/entitlements/check/${encodeURIComponent(
                normalizedFeatureKey
              )}`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          const allowed =
            response.data?.success === true &&
            response.data?.allowed === true;

          setAccessCache(
            (currentCache) => ({
              ...currentCache,

              [normalizedFeatureKey]:
                allowed,
            })
          );

          return allowed;
        } catch (requestError) {
          console.error(
            `Feature access check failed for ${normalizedFeatureKey}:`,
            requestError
          );

          return false;
        }
      },
      [token, accessCache]
    );

  // --------------------------------------------------
  // Read already-loaded feature flag
  // --------------------------------------------------
  const hasAccess =
    useCallback(
      (featureKey) => {
        if (!featureKey) {
          return false;
        }

        const normalizedFeatureKey =
          String(featureKey).trim();

        if (!entitlements) {
          return false;
        }

        return (
          entitlements.feature_flags?.[
            normalizedFeatureKey
          ] === true
        );
      },
      [entitlements]
    );

  // --------------------------------------------------
  // Get cap value
  // --------------------------------------------------
  const getCap =
    useCallback(
      (capKey) => {
        if (!capKey) {
          return null;
        }

        return (
          entitlements?.caps?.[
            capKey
          ] ?? null
        );
      },
      [entitlements]
    );

  // --------------------------------------------------
  // Current subscription tier
  // --------------------------------------------------
  const tier =
    entitlements?.tier || null;

  return {
    entitlements,

    tier,

    caps:
      entitlements?.caps || {},

    featureFlags:
      entitlements?.feature_flags || {},

    loading,

    error,

    fetchEntitlements,

    checkAccess,

    hasAccess,

    getCap,
  };
}

export default useEntitlement;