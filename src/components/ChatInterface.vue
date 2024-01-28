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
                console.log(this.input);
                this.webSocket.send(this.input);
            },
        },
        mounted() {
            if (this.webSocket.readyState === WebSocket.OPEN) {
                this.connected = true;
            }

            this.webSocket.onmessage = event => {
                console.log(event.data);
                const arr = this.messages;
                const idx = this.messageIdx;
                if (!arr[idx]) arr[idx] = {id: idx, header: "", body: ""};
                arr[idx].body += event.data;
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
    <div class="input">
        <input type="text" @keydown.enter="sendMessage" v-model="input" />
        <button @click="sendMessage">Send</button>
    </div>
</template>

<style scoped></style>
