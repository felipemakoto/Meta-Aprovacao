"use client";
import {useEffect,useRef} from "react";
import {trackCheckout} from "./checkout-events";

export default function CheckoutObserver() {
  const viewed=useRef(false);
  useEffect(() => {
    if(!viewed.current){viewed.current=true;trackCheckout("checkout_view");}
    const toggle = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLDetailsElement && target.open && target.dataset.checkoutFaq) {
        trackCheckout("checkout_faq", {item: target.dataset.checkoutFaq});
      }
    };
    const preview = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-checkout-preview]")) trackCheckout("checkout_preview");
    };
    document.addEventListener("toggle", toggle, true);
    document.addEventListener("click", preview);
    return () => {document.removeEventListener("toggle", toggle, true);document.removeEventListener("click", preview);};
  }, []);
  return null;
}
