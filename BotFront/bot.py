import os
import asyncio
from pathlib import Path

from dotenv import load_dotenv
from aiogram import Bot, Dispatcher
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.filters import CommandStart

# --- env ---
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

BOT_TOKEN = os.getenv("BOT_TOKEN")
if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN not found")

# --- bot ---
bot = Bot(BOT_TOKEN)
dp = Dispatcher()

MINI_APP_URL = "https://blink-wallet.tg/"  # ← ОСЬ ТУТ ПОСИЛАННЯ

@dp.message(CommandStart())
async def start_handler(message: Message):
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Open BlinkWallet",
                    web_app=WebAppInfo(url=MINI_APP_URL)
                )
            ]
        ]
    )

    await message.answer(
        "Відкрити Mini App:",
        reply_markup=keyboard
    )

async def main():
    print("Bot started")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
