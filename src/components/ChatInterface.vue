<script>
    export default {
        name: "ChatInterface",
        props: {
            webSocket: Object,
        },
        data() {
            return {
                input: "",
                connected: false,
                messages: [],
                messageIdx: 0,
            };
        },
        methods: {
            sendMessage() {
                this.webSocket.send(this.input);
                this.input = "";
            },
        },
        mounted() {
            if (this.webSocket.readyState === WebSocket.OPEN) {
                this.connected = true;
            }

            this.webSocket.onmessage = event => {
                const arr = this.messages;
                const idx = this.messageIdx;
                if (!arr[idx]) arr[idx] = {id: idx, header: "", body: ""};
                const obj = JSON.parse(event.data);
                if (obj.type === "message") {
                    arr[idx].body += obj.data;
                } else if (obj.type === "end") {
                    this.messageIdx++;
                }
            };

            this.webSocket.onclose = event => {
                this.connected = false;
            };
        },
        watch: {
            myArray: {
                handler(newArray, oldArray) {
                    console.log("myArray changed:", newArray);
                },
                deep: true,
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
</style>
