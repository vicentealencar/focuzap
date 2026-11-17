/*
 * Focuzap page script (MAIN world). Silences desktop notifications while focus
 * mode is on. The isolated content script publishes the state on
 * <html data-focuzap="on|off">; missing attribute counts as "on".
 */
(() => {
  const isOn = () => document.documentElement.dataset.focuzap !== 'off';

  const NativeNotification = window.Notification;
  if (NativeNotification) {
    class SilentNotification extends EventTarget {
      constructor(title, options = {}) {
        super();
        this.title = String(title);
        this.body = options.body || '';
        this.tag = options.tag || '';
        this.icon = options.icon || '';
        this.data = options.data ?? null;
        this.silent = true;
        this.onclick = this.onshow = this.onerror = this.onclose = null;
      }
      close() {}
    }

    window.Notification = new Proxy(NativeNotification, {
      construct(target, args, newTarget) {
        if (isOn()) return new SilentNotification(...args);
        return Reflect.construct(target, args, newTarget === window.Notification ? target : newTarget);
      },
    });
  }

  // ---------- sounds ----------
  // WhatsApp's UI sounds (new message, sent, etc.) are static audio assets.
  // User media (voice notes, videos, GIFs) is decrypted client-side and played
  // from blob: / MediaSource URLs, so those are always allowed through.
  const nativePlay = HTMLMediaElement.prototype.play;
  const isUserMedia = (src) => /^(blob:|mediasource:)/i.test(src);

  HTMLMediaElement.prototype.play = function (...args) {
    if (isOn() && this instanceof HTMLAudioElement) {
      const src = this.currentSrc || this.src || this.querySelector('source')?.src || '';
      if (src && !isUserMedia(src)) {
        console.debug('[focuzap] muted UI sound:', src.slice(0, 80));
        return Promise.resolve();
      }
    }
    return nativePlay.apply(this, args);
  };

  const SWR = window.ServiceWorkerRegistration;
  if (SWR && SWR.prototype.showNotification) {
    const native = SWR.prototype.showNotification;
    SWR.prototype.showNotification = function (...args) {
      if (isOn()) return Promise.resolve();
      return native.apply(this, args);
    };
  }
})();
