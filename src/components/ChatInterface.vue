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
            };
        },
        methods: {
            sendMessage() {
                console.log(this.input);
                this.webSocket.send(this.input);
            },
        },
        mounted() {
            if (this.webSocket.readyState === WebSocket.OPEN) {
                this.connected = true;
            }

            this.webSocket.onmessage = event => {
                console.log("Message received from server");
                console.log(event.data);
                this.messages = this.messages.concat(JSON.parse(event.data));
            };

            this.webSocket.onclose = event => {
                this.connected = false;
            };
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
                    <p>{{ message.username }}</p>
                </div>
                <div class="message-body">
                    <p>{{ message.message }}</p>
                </div>
            </div>
        </div>
    </div>
    <div class="input">
        <input type="text" @keydown.enter="sendMessage" v-model="input" />
        <button @click="sendMessage">Send</button>
    </div>
</template>

<style scoped></style>
