"use client";

import { useState, useEffect } from "react";

const Translator = () => {
  // 翻訳されたテキストを保存するための state
  const [translation, setTranslation] = useState<string>();
  // 音声合成のための voice を保存するための state
  const [voices, setVoices] = useState<Array<SpeechSynthesisVoice>>();
  // 翻訳する言語を保存するための state
  const [language, setLanguage] = useState<string>("en-US");
  // 認識されたテキストを保存するための state
  const [text, setText] = useState<string>();
  // true の場合は録音中、false の場合は録音していない
  const isActive = false;
  // true の場合は音声が認識されている、false の場合は認識されていない
  const isSpeechDetected = false;

  // 利用可能な言語の一覧
  // [ "ar-001", "bg-BG", "ca-ES", "cs-CZ", ... ]
  const availableLanguages = Array.from(
    new Set(voices?.map(({ lang }) => lang))
  ).sort();
  // console.log(availableLanguages);

  // 音声合成に利用する voice を指定の言語から選択
  // [{default:false, lang:"en-US", localService:true, name:"Aaron", voiceURI:"Aaron"}, {default:false, lang:"en-US", localService:true, name:"Bad News", voiceURI:"Bad News"}, ...]
  const availableVoices = voices?.filter(({ lang }) => lang === language);
  // console.log(availableVoices);

  // 音声合成を行うための voice を選択
  // Google または Luciana の voice が利用可能な場合はそれを選択
  // {default:false, lang:"en-US", localService:false, name:"Google US English", voiceURI:"Google US English"}
  const activeVoice =
    availableVoices?.find(({ name }) => name.includes("Google")) ||
    availableVoices?.find(({ name }) => name.includes("Luciana")) ||
    availableVoices?.[0];
  // console.log(activeVoice);

  useEffect(() => {
    // 音声合成に必要な voice の一覧を取得
    // https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices
    const voices = window.speechSynthesis.getVoices();
    // データが存在するか確認し保存
    if (Array.isArray(voices) && voices.length > 0) {
      setVoices(voices);
      return;
    }
    // データが存在しない場合は onvoiceschanged イベントを利用して取得
    if ("onvoiceschanged" in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = function () {
        const voices = window.speechSynthesis.getVoices();
        setVoices(voices);
      };
    }
  }, []);

  // 録音を処理する関数
  function handleOnRecord() {
    // console.log("handleOnRecord");

    // クロスブラウザ対応のため、SpeechRecognition オブジェクトを取得
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    // Speech Recognition API のインスタンスを生成
    const recognition = new SpeechRecognition();

    recognition.onresult = async function (event) {
      // ログとして書き出し中身を確認
      // console.log("event", event);

      // 認識されたテキストを取得
      const transcript = event.results[0][0].transcript;

      // 認識されたテキストを保存
      setText(transcript);

      // 翻訳をリクエストする
      const results = await fetch("/api/translate", {
        method: "POST",
        body: JSON.stringify({
          text: transcript,
          language,
        }),
      }).then((r) => r.json());
      // console.log(results);

      // 翻訳されたテキストを保存
      setTranslation(results.text);

      // 翻訳されたテキストを読み上げる
      const utterance = new SpeechSynthesisUtterance(results.text);
      if (activeVoice) {
        utterance.voice = activeVoice;
      }
      window.speechSynthesis.speak(utterance);
    };

    // 録音を開始します。
    recognition.start();
  }

  return (
    <div className="mt-12 px-4">
      <div className="max-w-lg rounded-xl overflow-hidden mx-auto">
        <div className="bg-zinc-200 p-4 border-b-4 border-zinc-300">
          <div className="bg-blue-200 rounded-lg p-2 border-2 border-blue-300">
            <ul className="font-mono font-bold text-blue-900 uppercase px-4 py-2 border border-blue-800 rounded">
              <li>&gt; Translation Mode:</li>
              <li>&gt; Dialect:</li>
            </ul>
          </div>
        </div>

        <div className="bg-zinc-800 p-4 border-b-4 border-zinc-950">
          <p className="flex items-center gap-3">
            <span
              className={`block rounded-full w-5 h-5 flex-shrink-0 flex-grow-0 ${
                isActive ? "bg-red-500" : "bg-red-900"
              } `}
            >
              <span className="sr-only">
                {isActive ? "Actively recording" : "Not actively recording"}
              </span>
            </span>
            <span
              className={`block rounded w-full h-5 flex-grow-1 ${
                isSpeechDetected ? "bg-green-500" : "bg-green-900"
              }`}
            >
              <span className="sr-only">
                {isSpeechDetected
                  ? "Speech is being recorded"
                  : "Speech is not being recorded"}
              </span>
            </span>
          </p>
        </div>

        <div className="bg-zinc-800 p-4">
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg bg-zinc-200 rounded-lg p-5 mx-auto">
            <form>
              <div>
                <label className="block text-zinc-500 text-[.6rem] uppercase font-bold mb-1">
                  Language
                </label>
                <select
                  className="w-full text-[.7rem] rounded-sm border-zinc-300 px-2 py-1 pr-7"
                  value={language}
                  onChange={(event) => {
                    setLanguage(event.currentTarget.value);
                  }}
                >
                  {availableLanguages.map((language) => {
                    return (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    );
                  })}
                </select>
              </div>
            </form>
            <p>
              <button
                className={`w-full h-full uppercase font-semibold text-sm  ${
                  isActive
                    ? "text-white bg-red-500"
                    : "text-zinc-400 bg-zinc-900"
                } color-white py-3 rounded-sm`}
                onClick={handleOnRecord}
              >
                {isActive ? "Stop" : "Record"}
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto mt-12">
        <p className="mb-4">Spoken Text:{text}</p>
        <p> Translation: {translation}</p>
      </div>
    </div>
  );
};

export default Translator;
