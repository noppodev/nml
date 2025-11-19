const PLAYGROUND_DEFAULT_CODE = `state count = 0
state name = "NML User"

div.container {
  style {
    font_family: "sans-serif"
    padding: "20px"
    background_color: "#f8f9fa"
    border_radius: "8px"
    text_align: "center"
  }

  h2 "Hello, " name
  p "現在のカウント: " count

  div.buttons {
    style { margin_top: "20px" }
    
    button(on: click { count.value += 1 }) {
      style {
        background_color: "#42b983"
        color: "white"
        border: "none"
        padding: "8px 16px"
        border_radius: "4px"
        margin_right: "10px"
        cursor: "pointer"
      }
      "増やす"
    }

    button(on: click { count.value = 0 }) {
      style {
        background_color: "#e74c3c"
        color: "white"
        border: "none"
        padding: "8px 16px"
        border_radius: "4px"
        cursor: "pointer"
      }
      "リセット"
    }
  }
}`;

document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    const preview = document.getElementById('preview');
    const runButton = document.getElementById('run-button');

    if (!editor || !preview || !runButton) return;

    // --- NML Transpiler Simulation ---
    const compileNML = (nml) => {
        const lines = nml.split('\n');
        let html = '';
        let script = 'const state = {};\n';
        script += 'const listeners = {};\n';
        script += `
            function updateState(key, value) {
                state[key] = value;
                document.querySelectorAll('[data-bind="' + key + '"]').forEach(el => {
                    if (el.tagName === 'INPUT') el.value = value;
                    else el.textContent = value;
                });
            }
        `;
        const styleBlocks = {}; // Store styles for elements
        let currentElementId = 0;
        let tagStack = []; // { indent, id }

        lines.forEach((line, index) => {
            const indent = line.search(/\S|$|/);
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('//')) return;

            while (tagStack.length > 0 && tagStack[tagStack.length - 1].indent >= indent) {
                html += `</${tagStack.pop().tag}>`;
            }

            if (trimmed.startsWith('state ')) {
                const match = trimmed.match(/state\s+(\w+)\s*=\s*(.+)/);
                if (match) script += `state['${match[1]}'] = ${match[2]};
`;
                return;
            }

            if (trimmed === 'style {') {
                if (tagStack.length > 0) {
                     tagStack[tagStack.length - 1].inStyleBlock = true;
                }
                return;
            }
            if (trimmed === '}') {
                 if (tagStack.length > 0 && tagStack[tagStack.length - 1].inStyleBlock) {
                    tagStack[tagStack.length - 1].inStyleBlock = false;
                 }
                 return;
            }
            // Style property
            if (tagStack.length > 0 && tagStack[tagStack.length - 1].inStyleBlock) {
                const styleMatch = trimmed.match(/([a-z_]+):\s*(.+)/);
                 if (styleMatch) {
                    const prop = styleMatch[1].replace(/_([a-z])/g, g => g[1].toUpperCase());
                    const value = styleMatch[2].replace(/["\',]/g, '');
                    const lastTag = tagStack[tagStack.length - 1];
                    if (!styleBlocks[lastTag.id]) styleBlocks[lastTag.id] = {};
                    styleBlocks[lastTag.id][prop] = value;
                }
                return;
            }


            const tagMatch = trimmed.match(/^([a-z0-9]+)(?:[.#]([a-zA-Z0-9_.-]+))?/);
            if (!tagMatch) return;
            
            const tagName = tagMatch[1];
            const classes = tagMatch[2] ? tagMatch[2].replace(/\./g, ' ') : '';
            const restOfLine = trimmed.substring(tagMatch[0].length);

            let attrs = `class="${classes}"`;
            let textContent = '';
            
            // Attributes
            const attrMatch = restOfLine.match(/^\(([^)]+)\)/);
            if (attrMatch) {
                const attrContent = attrMatch[1];
                // Event handling
                const eventMatch = attrContent.match(/on:\s*([a-z]+)\s*\{([^}]+)\}/);
                if (eventMatch) {
                    let js = eventMatch[2].trim();
                    // Basic state update conversion
                    const stateUpdateMatch = js.match(/(\w+)\.value\s*([+\-]?=)\s*(.*)/);
                    if(stateUpdateMatch){
                        const [, stateVar, operator, value] = stateUpdateMatch;
                         if(operator === '=') js = `updateState('${stateVar}', ${value})`;
                         if(operator === '+=') js = `updateState('${stateVar}', state.${stateVar} + ${value})`;
                    }
                    attrs += ` onclick="${js.replace(/"/g, "'")}"`;
                }

                // Other attributes
                 attrContent.replace(/on:.*?\}/, '').split(',').forEach(pair => {
                    const parts = pair.split(':').map(s => s.trim());
                    if (parts.length === 2 && parts[0] && parts[1]) {
                        attrs += ` ${parts[0]}=${parts[1]}`;
                    }
                });
            }

            // Text content
            const textPart = restOfLine.replace(/^\([^)]+\)\s*/, '').replace(/\{$/, '').trim();
            const textMatch = textPart.match(/^"([^\"]*)"(?:\s*(\w+))?/);
            if(textMatch){
                 textContent += textMatch[1];
                 if(textMatch[2]){ // Variable binding
                     textContent += `<span data-bind="${textMatch[2]}">${state[textMatch[2]] || ''}</span>`;
                     script += `updateState('${textMatch[2]}', state['${textMatch[2]}']);\n`
                 }
            } else if (textPart && /^[a-z_]+$/.test(textPart)) {
                 // Variable binding without text
                 textContent += `<span data-bind="${textPart}">${state[textPart] || ''}</span>`;
                 script += `updateState('${textPart}', state['${textPart}']);\n`
            }
            
            const elementId = `nml-el-${currentElementId++}`;
            attrs += ` id="${elementId}"`;
            html += `<${tagName} ${attrs}>${textContent}`;
            
            const hasBlock = line.includes('{');
            if (hasBlock) {
                tagStack.push({ indent, tag: tagName, id: elementId, inStyleBlock: false });
            } else {
                 html += `</${tagName}>`;
            }
        });

        while (tagStack.length > 0) {
            html += `</${tagStack.pop().tag}>`;
        }

        let styleScript = '';
        for (const id in styleBlocks) {
            styleScript += `
                const el_${id.replace(/-/g,'_')} = document.getElementById('${id}');
                if (el_${id.replace(/-/g,'_')}) Object.assign(el_${id.replace(/-/g,'_')}.style, ${JSON.stringify(styleBlocks[id])});
            `;
        }
        
        return `
            <html>
                <head>
                    <style>body { font-family: sans-serif; padding: 1rem; margin: 0; }</style>
                </head>
                <body>
                    ${html}
                    <script>
                        ${script}
                        document.addEventListener('DOMContentLoaded', () => {
                            try { ${styleScript} } catch(e) { console.error('Style Error:', e); }
                        });
                    </script>
                </body>
            </html>`;
    };

    // --- Editor Logic ---
    let debounceTimer;
    const updatePreview = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const code = editor.value;
            const compiled = compileNML(code);
            preview.srcdoc = compiled;
        }, 300);
    };

    // --- Initialize ---
    const setEditorCode = (code) => {
        editor.value = code;
        updatePreview();
    };

    // Set default code and run
    setEditorCode(PLAYGROUND_DEFAULT_CODE);

    // Add event listeners
    editor.addEventListener('input', updatePreview);
    runButton.addEventListener('click', updatePreview);

    // Expose a function for the chat widget to use
    window.applyCodeToPlayground = setEditorCode;
});
