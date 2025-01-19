async function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    const responseDiv = document.getElementById('response');
    
    if (!userInput) {
        alert('请输入消息');
        return;
    }

    // 清空之前的响应
    responseDiv.textContent = '';

    const requestData = {
        bot_id: "7461531062162751523",
        user_id: "123456789",
        stream: true,
        auto_save_history: true,
        additional_messages: [
            {
                role: "user",
                content: userInput,
                content_type: "text"
            }
        ]
    };

    try {
        const response = await fetch('https://api.coze.cn/v3/chat', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer pat_gJ31wMcmtUUxyaOPyss4OrkAg7lrLHY4tLWGKENRLa11iaOyM0dfLSPdCsqbHtep',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = ''; // 用于存储未完整的事件数据

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                break;
            }

            // 解码新接收的数据并添加到缓冲区
            buffer += decoder.decode(value);
            
            // 按行分割数据
            const lines = buffer.split('\n');
            buffer = ''; // 清空缓冲区

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // 如果这不是最后一行，处理当前行
                if (i < lines.length - 1) {
                    processEventLine(line, responseDiv);
                } else {
                    // 如果是最后一行，可能是不完整的，将其放回缓冲区
                    buffer = line;
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
        responseDiv.textContent = `发生错误: ${error.message}`;
    }
}

// 处理单行事件数据
function processEventLine(line, responseDiv) {
    // 解析事件行
    if (line.startsWith('event:')) {
        const [eventType, data] = line.split('\n');
        const event = eventType.replace('event:', '').trim();

        // 如果下一行是数据行
        if (data && data.startsWith('data:')) {
            const jsonStr = data.replace('data:', '').trim();
            try {
                const jsonData = JSON.parse(jsonStr);
                
                // 处理conversation.message.delta事件
                if (event === 'conversation.message.delta' && 
                    jsonData.type === 'answer' && 
                    jsonData.content) {
                    responseDiv.textContent = jsonData.content;
                }
            } catch (e) {
                console.error('JSON解析错误:', e);
            }
        }
    } else if (line.startsWith('data:')) {
        const jsonStr = line.replace('data:', '').trim();
        try {
            // 处理[DONE]标记
            if (jsonStr === '"[DONE]"') {
                console.log('数据流结束');
                return;
            }

            const jsonData = JSON.parse(jsonStr);
            if (jsonData.type === 'answer' && jsonData.content) {
                responseDiv.textContent = jsonData.content;
            }
        } catch (e) {
            console.error('JSON解析错误:', e);
        }
    }
}

// 添加回车键发送功能
document.getElementById('userInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
