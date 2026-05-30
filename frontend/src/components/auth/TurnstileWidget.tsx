import React, { useEffect, useRef } from 'react';
import Script from 'next/script';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

export default function TurnstileWidget({ onVerify, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
  }, [onVerify, onExpire]);

  const siteKey = process.env.NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY || "0x4AAAAAADZx11Q4MVy6oCBl";

  useEffect(() => {
    const renderWidget = () => {
      if (containerRef.current && (window as any).turnstile) {
        if (widgetIdRef.current) {
          try {
            (window as any).turnstile.remove(widgetIdRef.current);
          } catch (e) {
            console.error("Failed to remove turnstile instance:", e);
          }
          widgetIdRef.current = null;
        }

        try {
          widgetIdRef.current = (window as any).turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              onVerifyRef.current(token);
            },
            'expired-callback': () => {
              if (onExpireRef.current) onExpireRef.current();
            }
          });
        } catch (err) {
          console.error("Error rendering Cloudflare Turnstile:", err);
        }
      }
    };

    if ((window as any).turnstile) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if ((window as any).turnstile) {
          renderWidget();
          clearInterval(interval);
        }
      }, 100);
      return () => {
        clearInterval(interval);
      };
    }

    return () => {
      if (widgetIdRef.current && (window as any).turnstile) {
        try {
          (window as any).turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0', minHeight: '65px' }}>
      <div ref={containerRef} />
      <Script 
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" 
        strategy="afterInteractive"
      />
    </div>
  );
}
