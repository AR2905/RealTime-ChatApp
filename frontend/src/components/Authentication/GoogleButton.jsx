import React, { useEffect } from "react";
import { Box, Text } from "@chakra-ui/react";
import {
  renderGoogleButton,
  getGoogleClientId,
} from "../../config/googleAuth";

const GoogleButton = ({ onCredential }) => {
  const [showFallback, setShowFallback] = React.useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const ok = await renderGoogleButton("google-signin-btn", onCredential);
        if (!cancelled && !ok) setShowFallback(true);
      } catch (err) {
        if (!cancelled) setShowFallback(true);
      }
    };

    if (getGoogleClientId()) {
      init();
    } else {
      setShowFallback(true);
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (showFallback) {
    return (
      <Box
        w="100%"
        p={3}
        borderWidth="1px"
        borderRadius="md"
        bg="gray.100"
        textAlign="center"
      >
        <Text fontSize="sm" color="gray.600">
          Google login is not configured. Set <b>REACT_APP_GOOGLE_CLIENT_ID</b> in
          the frontend env to enable "Continue with Google".
        </Text>
      </Box>
    );
  }

  return (
    <Box id="google-signin-btn" w="100%" display="flex" justifyContent="center" />
  );
};

export default GoogleButton;