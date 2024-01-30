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
            checkConnection() {
                if (this.webSocket.readyState !== this.webSocket.OPEN) {
                    clearTimeout(this.checkTimeout);
                    this.connectWebSocket();
                } else {
                    setTimeout(this.checkConnection, 200);
                }
            },
            handleDataFinished() {
                this.$refs.itemTable.getItems();
            },
            connectWebSocket() {
                this.webSocketStatus = "connecting";
                console.log("connecting");
                const ws = this.webSocket;

                ws.onopen = () => {
                    this.webSocketStatus = "connected";
                    clearTimeout(this.reconnectTimeout);
                    if (this.firstLoad) {
                        this.webSocket.send(JSON.stringify({message: "welcomePrompt"}));
                        this.firstLoad = false;
                    }
                    this.checkTimeout = setTimeout(this.checkConnection, 200);
                    return false;
                };

                ws.onclose = () => {
                    this.webSocketStatus = "disconnected";
                    this.connectWebSocket();
                };

                this.reconnectTimeout = setTimeout(() => {
                    console.log("EHHHHU");
                    this.connectWebSocket();
                }, 5000);
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
                const path = "/ws";
                return `${protocol}://${host}${path}`;
            },
        },
        mounted() {
            this.webSocket = new WebSocket(this.getWebSocketUrl());
            this.connectWebSocket();
            window.addEventListener("resize", () => {
                if (!this.collapsed) {
                    this.leftWidth = window.innerWidth / 1.5;
                }
            });
        },
        watch: {
            webSocketStatus() {
                console.log(this.webSocketStatus);
            },
        },
    };
</script>

<template>
    <div class="wrapper">
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
</style>
