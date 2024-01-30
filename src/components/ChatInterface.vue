<script>
    export default {
        name: "ChatInterface",
        props: {
            webSocket: Object,
            webSocketConnected: Boolean,
        },
        data() {
            return {
                input: "",
                connected: false,
                messages: [],
                messageIdx: 0,
                loading: false,
            };
        },
        methods: {
            sendMessage() {
                this.webSocket.send(this.input);
                (this.loading = true), (this.input = "");
            },
        },
        mounted() {
            console.log("why");
            console.log(this.webSocketConnected);
        },
        watch: {
            webSocketConnected: {
                immediate: true,
                handler(newProp, oldProp) {
                    console.log(newProp, oldProp);
                    if (newProp === true) {
                        this.connected = true;
                        this.webSocket.onmessage = event => {
                            const arr = this.messages;
                            const idx = this.messageIdx;
                            if (!arr[idx]) arr[idx] = {id: idx, header: "", body: ""};

                            const obj = JSON.parse(event.data);
                            if (obj.type === "message") {
                                this.loading = false;
                                arr[idx].body += obj.data;
                            } else if (obj.type === "end") {
                                this.loading = false;
                                this.messageIdx++;
                            }
                        };

                        this.webSocket.onclose = event => {
                            this.connected = false;
                        };
                    }
                },
            },
        },
    };
</script>

<template>
    <div>
        <h1>Chat Interface</h1>
    </div>
    <div class="messages">
        <div v-for="message in messages" :key="message.id">
            <div class="message">
                <div class="message-header">
                    <p>{{ message.header }}</p>
                </div>
                <div class="message-body">
                    <p>{{ message.body }}</p>
                </div>
            </div>
        </div>
    </div>
    <div class="chat-input">
        <input type="text" @keydown.enter="sendMessage" v-model="input" />
        <div class="spinner" v-if="loading"></div>
        <button @click="sendMessage">Send</button>
    </div>
</template>

<style scoped>
    .chat-input {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        position: absolute;
        bottom: 0;
    }
    .chat-input input {
        flex: 1;
        margin-right: 10px;
        padding: 10px;
        border-radius: 5px;
        border: 1px solid #ccc;
    }
    .chat-input button {
        padding: 10px;
        border-radius: 5px;
        border: 1px solid #ccc;
        background-color: #eee;
    }
    .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        animation: spin 2s linear infinite;
    }
    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>
