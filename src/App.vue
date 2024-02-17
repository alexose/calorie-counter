<script>
    import ItemTable from "./components/ItemTable.vue";
    import ChatInterface from "./components/ChatInterface.vue";
    export default {
        name: "Calorie Tracker",
        data() {
            return {
                isResizing: false,
                leftWidth: window.innerWidth / 1.5,
                startWidth: 0,
                startX: 0,
                showIntro: null,
                collapsed: false,
                webSocket: null,
                webSocketStatus: "disconnected",
                reconnectTimeout: null,
                checkTimeout: null,
                firstLoad: true,
            };
        },
        components: {
            ItemTable,
            ChatInterface,
        },
        methods: {
            async begin() {
                this.showIntro = false;
                this.loading = true;

                // Request a new session
                fetch("/session", {
                    method: "POST",
                })
                    .then(response => response.json())
                    .then(async data => {
                        window.location.hash = data.sessionId;
                        await this.connectWebSocket();
                        this.loading = false;
                    })
                    .catch(error => {
                        console.error("Error:", error);
                        this.loading = false;
                    });
            },
            toggleChat() {
                // Calculate 66% of the width of the viewport
                this.leftWidth = this.leftWidth || window.innerWidth / 1.5;
                this.collapsed = !this.collapsed;
            },
            submitQuery() {
                this.webSocket.send(JSON.stringify({message: "Hello, server."}));
            },
            startResize(event) {
                this.isResizing = true;

                // Disallow text selection while dragging resizer
                event.preventDefault();
                event.stopPropagation();

                this.startX = event.clientX;
                this.startWidth = this.leftWidth;
                document.addEventListener("mousemove", this.resizeHandler);
                document.addEventListener("mouseup", this.stopResize);
            },
            handleDataFinished() {
                this.$refs.itemTable.getItems();
            },
            async connectWebSocket() {
                this.webSocketStatus = "connecting";
                this.webSocket = new WebSocket(this.getWebSocketUrl());
                const ws = this.webSocket;

                ws.onopen = () => {
                    this.webSocketStatus = "connected";
                    if (this.firstLoad) {
                        this.webSocket.send(JSON.stringify({message: "welcomePrompt"}));
                        this.firstLoad = false;
                    }
                    return false;
                };

                ws.onclose = event => {
                    this.webSocketStatus = "disconnected";
                    if (!event.wasClean) {
                        setTimeout(() => {
                            this.connectWebSocket();
                        }, 1000);
                    }
                };
            },
            resizeHandler(event) {
                if (this.isResizing) {
                    const dx = event.clientX - this.startX;
                    this.leftWidth = this.startWidth + dx;
                }
            },
            stopResize(event) {
                this.isResizing = false;
                document.removeEventListener("mousemove", this.resizeHandler);
                document.removeEventListener("mouseup", this.stopResize);
            },
            getWebSocketUrl() {
                const protocol = window.location.protocol === "https:" ? "wss" : "ws";
                const host = window.location.host;
                const hash = window.location.hash.replace("#", "");
                const path = "/ws/" + hash;
                return `${protocol}://${host}${path}`;
            },
        },
        mounted() {
            // We don't have a hash, display the introduction modal
            if (!window.location.hash) {
                this.showIntro = true;
            } else {
                this.showIntro = false;
                this.connectWebSocket();
            }
            window.addEventListener("resize", () => {
                if (!this.collapsed) {
                    this.leftWidth = window.innerWidth / 1.5;
                }
            });
        },
    };
</script>

<template>
    <div v-if="showIntro" class="intro-modal">
        <div class="intro-modal-inner">
            <h1>Welcome to Alex's Calorie Tracker</h1>
            <p>
                This is a simple calorie tracker that allows you to add, edit, and delete items from your daily intake.
                You can also chat with the server to20get some helpful tips and tricks.
            </p>
            <button @click="begin">Get Started</button>
            <div class="spinner" v-if="loading"></div>
        </div>
    </div>
    <div v-if="showIntro === false" class="wrapper">
        <div class="left-pane item-table" :style="{width: collapsed ? '100%' : leftWidth + 'px'}">
            <h1>Alex's Calorie Tracker v1</h1>
            <ItemTable ref="itemTable" />
        </div>
        <div class="divider" @mousedown="startResize" v-if="!collapsed"></div>
        <div class="right-pane chat-interface" :class="{collapsed: collapsed}">
            <ChatInterface
                @data-finished="handleDataFinished"
                :webSocket="webSocket"
                :webSocketStatus="webSocketStatus"
            />
        </div>
    </div>
    <!-- <div class="chat-toggle" @click="toggleChat">Chat!</div> -->
</template>

<style scoped>
    header {
        line-height: 1.5;
    }

    .wrapper {
        display: flex;
        flex-direction: row;
        height: 100vh;
    }

    .intro-modal {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 20px;
    }

    .intro-modal-inner {
        max-width: 600px;
        margin: 0 auto;
        border: 5px solid #ccc;
        border-radius: 20px;
        padding: 50px;
    }

    .left-pane,
    .divider {
        flex-shrink: 0;
    }

    .left-pane,
    .right-pane {
        padding: 20px;
        overflow: auto;
    }

    .right-pane {
        width: 100%;
    }

    .right-pane.collapsed {
        width: 0;
        opacity: 0;
    }

    .divider {
        background-color: #eee;
        width: 5px;
        height: 100vh;
        cursor: ew-resize;
    }

    .resizer {
        width: 5px;
        cursor: ew-resize;
        background-color: #000;
    }

    .wrapper.collapsed .item-table {
        width: 100%;
    }

    .wrapper.collapsed .chat-interface {
        width: 0;
    }

    .wrapper .item-table {
        width: 100%;
        max-width: 100%;
        height: 100%;
        max-height: 100%;
    }

    .chat-toggle {
        position: fixed;
        top: 0;
        right: 0;
        padding: 1rem;
        margin: 2rem;
        background: var(--color-primary);
        color: var(--color-white);
        cursor: pointer;
        border: 1px solid #eee;
        border-radius: 0 0 0 1rem;
    }

    @media (min-width: 1024px) {
        header {
            display: flex;
            place-items: center;
            padding-right: calc(var(--section-gap) / 2);
        }

        .logo {
            margin: 0 2rem 0 0;
        }

        header .wrapper {
            display: flex;
            place-items: flex-start;
            flex-wrap: wrap;
        }
    }
    .spinner {
        margin-left: 20px;
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
