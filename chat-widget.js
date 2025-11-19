// --- IMPORTANT ---
// Replace with your actual Google AI API key
const API_KEY = "AIzaSyBmp3ixWO_mmEmxE__c73EtcBRpUn1SiD4"; 
// -----------------

// This is the system prompt sent to the AI model.
const AI_SYSTEM_PROMPT = `
あなたは、革新的な新しいWebプログラミング言語「NML (Noppo Markup Language)」の公式AIドキュメントアシスタントです。
ユーザーはNMLの開発者や学習者です。以下の【NML完全マニュアル】に基づいて、ユーザーの質問に親切かつ正確に答えてください。

あなたの役割：
- NMLの大ファンとして振る舞う。
- Rubyのようにエレガントで、書くことが楽しいこの言語の魅力を伝える。
- 常に丁寧で、励ますようなトーンで話す。
- サイト内には「プレイグラウンド」があり、ユーザーはそこでコードを実行できることを案内する。
- **重要**: ユーザーからコードの作成や修正を依頼された場合、あなたはNML形式のコードブロックを作成する。ユーザーはそのコードをワンクリックでプレイグラウンドに適用できる。

--- NML完全マニュアル ---
# NML (Noppo Markup Language) 完全マニュアル

## 1. NMLの哲学と概要
NML (Noppo Markup Language) は、既存の Web 開発の複雑さ（HTML、CSS、JavaScript の分離）を解決するために設計された、**究極の Web 記述言語**です。
*   **単一言語の原則**: 構造 (HTML)、見た目 (CSS)、動き (JS) のすべてを、統一された「ユニバーサル・タグ (UTag)」構文で記述します。
*   **Ruby的エレガンス**: 冗長な記述を避け、インデントと直感的なキーワードを使用し、書いていて楽しい高い生産性を実現します。
*   **ビルトイン・リアクティビティ**: 状態管理が言語のコア機能として組み込まれており、DOM を直接操作することなく、データ変更に UI が自動で追従します。

## 2. NMLの基本構文 (UTag)
NMLのコードは、すべて **UTag (ユニバーサル・タグ)** と呼ばれる自己完結型のブロックで構成されます。

### 2.1. 要素と階層
要素の親子関係は、Ruby や Python のように**インデント**によって表現されます。終了タグは不要です。
例: 	div(id: "app") { h1 "Hello" }

### 2.2. 属性と値
属性の記述は、括弧 	() を使用した **\`キー: 値\`** の形式を取ります。CSSセレクタ風のショートハンドも利用できます。
例: 	 a(href: "/home", target: "_blank")

## 3. 状態管理 (State & Binding)
NML のリアクティブな状態管理は、Web 開発における最も面倒な「データと UI の同期」を自動化します。

### 3.1. 状態の宣言 (\`state\`)
\`state\` キーワードで宣言された変数は、自動的にリアクティブ（反応性を持つ）になります。
\`\`\`nml
state count = 0
\`\`\`

### 3.2. データバインディング
要素のコンテンツ内に状態変数を記述するだけで、バインディングが完了します。
\`\`\`nml
h1 "現在の値: " count
\`\`\`

### 3.3. イベントハンドリング (\`on:\`)
要素の属性に \`on:\` プレフィックスを付けることで、イベント時の動作を記述できます。
\`\`\`nml
button(on: click { count.value += 1 }) "クリック" 
\`\`\`

## 4. スタイル記述の統合 (Scoped Style)
NMLは、スタイル定義をその要素に自動的に適用し、カプセル化（スコープ化）します。
推奨されるスタイル名はアンダースコア形式 (\`background_color\`) です。

## 5. NMLの開発環境
NMLはブラウザが直接実行する言語ではありません。通常はコンパイラを使用しますが、本サイトの「プレイグラウンド」ではリアルタイムにコンパイルと実行を試すことができます。
`;

import { GoogleGenAI } from "https://esm.run/@google/genai";

document.addEventListener('DOMContentLoaded', () => {
    const chatWidgetButton = document.getElementById('chat-widget-button');
    const chatWidgetWindow = document.getElementById('chat-widget-window');
    const chatMessagesContainer = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatSubmitButton = document.getElementById('chat-submit');

    if (!chatWidgetButton || !chatWidgetWindow || !chatMessagesContainer || !chatForm || !chatInput || !chatSubmitButton) {
        console.error("Chat widget elements not found.");
        return;
    }
    
    let isOpen = false;
    let isLoading = false;
    let chatSession = null;
    let isApiKeyValid = false;
    
    // --- UI Toggle ---
    chatWidgetButton.addEventListener('click', () => {
        isOpen = !isOpen;
        chatWidgetButton.classList.toggle('is-open');

        if (isOpen) {
            chatWidgetWindow.classList.remove('opacity-0', 'scale-95', '-translate-y-10', 'pointer-events-none');
            chatWidgetWindow.classList.add('opacity-100', 'scale-100', 'translate-y-0', 'pointer-events-auto');
            chatInput.focus();
        } else {
            chatWidgetWindow.classList.add('opacity-0', 'scale-95', '-translate-y-10', 'pointer-events-none');
            chatWidgetWindow.classList.remove('opacity-100', 'scale-100', 'translate-y-0', 'pointer-events-auto');
        }
    });

    // --- Initialize Chat ---
    function initializeChat() {
        try {
            if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
                addMessage('model', 'AIアシスタントへようこそ！\nチャット機能を利用するには、`chat-widget.js`ファイルに有効なGoogle AI APIキーを設定してください。');
                disableChatInput('APIキーが設定されていません');
                isApiKeyValid = false;
                return;
            }
            
            const genAI = new GoogleGenAI(API_KEY);
            chatSession = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).startChat({
                 systemInstruction: AI_SYSTEM_PROMPT,
            });
            isApiKeyValid = true;
            addMessage('model', 'こんにちは！NMLについて何でも聞いてください。\n例：「コンポーネントの作り方は？」');
        } catch (error) {
            console.error("Failed to initialize GoogleGenAI:", error);
            addMessage('model', 'AIアシスタントの初期化中にエラーが発生しました。APIキーが正しいか確認してください。');
            disableChatInput('AIの初期化に失敗');
            isApiKeyValid = false;
        }
    }

    function disableChatInput(placeholderText) {
        chatInput.disabled = true;
        chatSubmitButton.disabled = true;
        chatInput.placeholder = placeholderText;
    }
    
    // Call initialization function
    initializeChat();

    // --- Form Submission ---
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageText = chatInput.value.trim();
        if (!messageText || isLoading || !isApiKeyValid) return;

        addMessage('user', messageText);
        chatInput.value = '';
        setLoading(true);

        try {
            const result = await chatSession.sendMessageStream(messageText);
            const modelMessageElement = addMessage('model', '');
            
            let fullResponse = '';
            for await (const chunk of result.stream) {
                 const chunkText = chunk.text();
                 fullResponse += chunkText;
                 renderMessageText(modelMessageElement.querySelector('.message-content'), fullResponse);
                 scrollToBottom();
            }
        } catch (error) {
            console.error("Chat Error:", error);
            addMessage('model', 'すみません、エラーが発生しました。もう一度お試しください。');
        } finally {
            setLoading(false);
        }
    });
    
    // --- Helper Functions ---
    function setLoading(state) {
        isLoading = state;
        if (isApiKeyValid) {
            chatInput.disabled = isLoading;
            chatSubmitButton.disabled = isLoading;
        }
        if (isLoading) {
            addTypingIndicator();
        } else {
            removeTypingIndicator();
        }
    }

    let typingIndicator;
    function addTypingIndicator() {
        if (typingIndicator) return;
        typingIndicator = document.createElement('div');
        typingIndicator.className = 'flex justify-start';
        typingIndicator.innerHTML = `
            <div class="w-5 h-5 text-nml-green animate-spin">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader-2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            </div>`;
        chatMessagesContainer.appendChild(typingIndicator);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        if (typingIndicator) {
            typingIndicator.remove();
            typingIndicator = null;
        }
    }

    function addMessage(role, text) {
        removeTypingIndicator();
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

        const messageBubble = document.createElement('div');
        messageBubble.className = `max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${ 
            role === 'user' ? 'bg-nml-green text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
        }`;
        
        if (role === 'model') {
            const authorHtml = `<div class="flex items-center gap-2 mb-1 opacity-50 text-xs font-bold uppercase tracking-wider">
                <i data-lucide="bot" class="w-3 h-3"></i> NML AI
            </div>`;
            messageBubble.innerHTML = authorHtml;
        }

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        renderMessageText(messageContent, text);
        
        messageBubble.appendChild(messageContent);
        messageWrapper.appendChild(messageBubble);
        chatMessagesContainer.appendChild(messageWrapper);
        
        // Render any new icons added to the DOM dynamically
        lucide.createIcons({
            nodes: [messageWrapper]
        });

        scrollToBottom();
        return messageWrapper;
    }
    
    function renderMessageText(container, text) {
        container.innerHTML = '';
        const parts = text.split(/(```nml[\s\S]*?```)/g);
        
        parts.forEach((part) => {
            if (part.startsWith('```nml')) {
                const code = part.replace(/```nml\n?/, '').replace(/```$/, '').trim();
                const codeBlockWrapper = document.createElement('div');
                codeBlockWrapper.className = 'my-2 overflow-hidden rounded-lg border border-slate-200 bg-[#1e1e1e]';
                
                const header = document.createElement('div');
                header.className = 'bg-slate-800 text-xs text-slate-400 px-3 py-1 flex justify-between items-center';
                
                const langSpan = document.createElement('span');
                langSpan.textContent = 'NML';
                header.appendChild(langSpan);

                if (window.applyCodeToPlayground) {
                    const runButton = document.createElement('button');
                    runButton.className = 'flex items-center text-nml-green hover:text-white transition-colors font-bold';
                    runButton.innerHTML = `<i data-lucide="arrow-right-circle" class="w-3 h-3 mr-1"></i> Run in Editor`;
                    runButton.onclick = () => {
                        window.applyCodeToPlayground(code);
                        if (!window.location.pathname.includes('playground.html')) {
                            const currentUrl = new URL(window.location.href);
                            currentUrl.pathname = currentUrl.pathname.replace(/[^/]*$/, 'playground.html');
                            window.location.href = currentUrl.href;
                        }
                    };
                    header.appendChild(runButton);
                }

                const pre = document.createElement('pre');
                pre.className = 'text-slate-200 p-3 text-xs overflow-x-auto font-mono';
                pre.textContent = code;

                codeBlockWrapper.appendChild(header);
                codeBlockWrapper.appendChild(pre);
                container.appendChild(codeBlockWrapper);
            } else {
                const span = document.createElement('span');
                span.className = 'whitespace-pre-wrap';
                span.textContent = part;
                container.appendChild(span);
            }
        });
    }

    function scrollToBottom() {
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
});
