<script>
    export default {
        name: "ChatInterface",
        props: {
            webSocket: Object,
            webSocketStatus: String,
            messages: Array,
            loading: Boolean,
            sendMessage: Function,
        },
        data() {
            return {
                input: "",
                error: "",
                connected: false,
            };
        },
        methods: {
            scroll() {
                const container = document.getElementById("scrollContainer");
                container.scrollTop = container.scrollHeight;
            },
            send() {
                if (this.input) {
                    this.sendMessage(this.input);
                    this.input = "";
                }
            },
        },
        watch: {
            webSocketStatus: {
                immediate: true,
                handler(newProp, oldProp) {
                    this.connected = newProp === "connected";
                },
            },
        },
    };
</script>

<template>
    <div :class="['chat', {connected: connected}]">
        <div class="chat-connecting" v-if="!connected">
            <p>Connecting...</p>
        </div>
        <div class="messages" id="scrollContainer">
            <div v-for="message in messages" :key="message.id">
                <div class="message">
                    <div class="message-datetime">
                        <p>{{ message.datetime }}</p>
                    </div>
                    <div class="message-header">
                        <p>{{ message.header }}</p>
                    </div>
                    <div class="message-body">
                        <p>{{ message.body }}</p>
                    </div>
                </div>
            </div>
            <p v-if="error" style="color: red">{{ error }}</p>
        </div>
        <div class="chat-input">
            <input type="text" @keydown.enter="send" v-model="input" />
            <button @click="sendMessage">Send</button>
            <div class="spinner" v-if="loading"></div>
        </div>
    </div>
</template>

<style scoped>
    .chat {
        opacity: 0.5;
        position: relative;
        height: 100%;
    }
    .chat.connected {
        opacity: 1;
    }
    .chat-connecting {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        height: 100%;
    }
    .chat-input {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        position: absolute;
        bottom: 0;
        right: 0;
        left: 0;
    }
    .chat-input input {
        flex: 1;
        margin-right: 10px;
        padding: 10px;
        border-radius: 5px;
        border: 1px solid #ccc;
    }
    .messages {
        max-height: calc(100vh - 100px);
        overflow-y: auto;
    }
    .message {
        margin-bottom: 30px;
        margin-right: 20px;
    }
    .message-datetime {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 5px 0;
        color: #aaa;
        font-variant: small-caps;
        font-size: 12px;
    }
    .chat-input button {
        padding: 10px;
        border-radius: 5px;
        border: 1px solid #ccc;
        background-color: #eee;
    }
</style>
