from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
import uvicorn
from datetime import datetime

app = FastAPI()

connections = {}
usernames = {}

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return {"message": "Chatterbox Server Running"}


async def broadcast(data):
    for connection in connections:
        await connection.send_json(data)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):

    await ws.accept()

    try:
        data = await ws.receive_json()

        username = data.get("username", "Anonymous")

        connections[ws] = ws
        usernames[ws] = username

        await broadcast({
            "type": "system",
            "message": f"{username} joined the chat 👋"
        })

        while True:

            data = await ws.receive_json()

            if data["type"] == "chat":

                await broadcast({
                    "type": "chat",
                    "username": username,
                    "message": data["message"],
                    "time": datetime.now().strftime("%H:%M")
                })

            if data["type"] == "typing":

                await broadcast({
                    "type": "typing",
                    "username": username
                })

            if data["type"] == "stop_typing":

                await broadcast({
                    "type": "stop_typing"
                })

    except WebSocketDisconnect:

        user = usernames.get(ws, "Someone")

        connections.pop(ws, None)
        usernames.pop(ws, None)

        await broadcast({
            "type": "system",
            "message": f"{user} left the chat ❌"
        })


if __name__ == "__main__":
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)