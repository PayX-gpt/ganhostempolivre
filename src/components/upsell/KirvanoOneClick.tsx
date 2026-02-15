import { useEffect } from "react";

interface Props {
  /** The full Kirvano script tag content (the src URL from the script tag) */
  scriptUrl: string;
}

/**
 * Injects the Kirvano one-click upsell script into the page.
 * The script looks for elements with classes:
 * - kirvano-payment-trigger (accept/buy buttons)
 * - kirvano-refuse-trigger (decline buttons)
 */
const KirvanoOneClick = ({ scriptUrl }: Props) => {
  useEffect(() => {
    if (!scriptUrl) return;

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [scriptUrl]);

  return null;
};

export default KirvanoOneClick;
