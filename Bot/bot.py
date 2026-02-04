import os
import asyncio
from pathlib import Path

from dotenv import load_dotenv
from aiogram import Bot, Dispatcher
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from aiogram.filters import CommandStart

# env
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

BOT_TOKEN = os.getenv("BOT_TOKEN")
if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN not found")

# bot
bot = Bot(BOT_TOKEN)
dp = Dispatcher()

MINI_APP_URL = "https://blinkwallet-4rh.pages.dev/"


@dp.message(CommandStart())
async def start_handler(message: Message):
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(
                    text="Wallet",
                    web_app=WebAppInfo(url=MINI_APP_URL)
                )
            ]
        ],
        resize_keyboard=True
    )

    await message.answer(
        "Open Mini App:",
        reply_markup=keyboard
    )


async def main():
    print("Bot started")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
