let recognition = null;

export function isVoiceSupported() {
  return Boolean(
    window.SpeechRecognition ||
    window.webkitSpeechRecognition
  );
}

export function startVoiceRecognition({
  lang = "en-IN",
  onResult,
  onError,
  onEnd
} = {}) {

  if (!isVoiceSupported()) {
    onError?.(
      new Error("Speech recognition is not supported.")
    );
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();

  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  recognition.onresult = (event) => {

    const result =
      event.results?.[0]?.[0]?.transcript?.trim();

    if (result) {
      onResult?.(result);
    }
  };

  recognition.onerror = (event) => {
    onError?.(event);
  };

  recognition.onend = () => {
    recognition = null;
    onEnd?.();
  };

  try {
    recognition.start();
  } catch (error) {
    recognition = null;
    onError?.(error);
  }
}

export function stopVoiceRecognition() {

  if (recognition) {
    try {
      recognition.stop();
    } catch {
      // Recognition may already be stopped.
    }

    recognition = null;
  }
}
