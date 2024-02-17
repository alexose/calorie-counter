<script>
    export default {
        name: "ChatInterface",
        props: {
            webSocket: Object,
            webSocketStatus: String,
        },
        data() {
            return {
                input: "",
                error: "",
                connected: false,
                messages: [],
                messageIdx: 0,
                loading: false,
            };
        },
        methods: {
            sendMessage() {
                this.webSocket.send(JSON.stringify({message: this.input}));
                const arr = this.messages;
                const idx = this.messageIdx;
                this.error = null;
                arr[idx] = {
                    id: idx,
                    header: "Me:",
                    body: this.input,
                    datetime: new Date().toLocaleString(),
                };
                this.messageIdx++;

                this.scroll();

                (this.loading = true), (this.input = "");
            },
            scroll() {
                const container = document.getElementById("scrollContainer");
                container.scrollTop = container.scrollHeight;
            },
        },
        watch: {
            webSocketStatus: {
                immediate: true,
                handler(newProp, oldProp) {
                    this.connected = newProp === "connected";
                    if (newProp === "connected") {
                        this.webSocket.onmessage = event => {
                            const obj = JSON.parse(event.data);
                            if (obj.type === "reload") {
                                this.$emit("data-finished");
                                return;
                            }
                            if (obj.type === "error") {
                                this.error = obj.data;
                                return;
                            }

                            const arr = this.messages;
                            const idx = this.messageIdx;
                            if (!arr[idx]) {
                                arr[idx] = {
                                    id: idx,
                                    header: "",
                                    body: "",
                                    datetime: new Date().toLocaleString(),
                                };
                            }

                            if (obj.type === "message") {
                                this.loading = false;
                                arr[idx].body += obj.data;
                            } else if (obj.type === "end") {
                                this.loading = false;
                                this.messageIdx++;
                            }
                            this.scroll();
                        };
                    }
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
            <input type="text" @keydown.enter="sendMessage" v-model="input" />
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
