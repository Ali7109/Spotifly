from upstash_redis import Redis
from dotenv import load_dotenv
import os

load_dotenv()
REDIS_URL = os.getenv("UPSTASH_REDIS_REST_URL")
REDIS_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")


class RedisCache:
    def __init__(self):
        self.cache = Redis(url=REDIS_URL, token=REDIS_TOKEN)
        print("Connected to Upstash Redis")

    def get(self, key: str):
        return self.cache.get(key)

    def set(self, key: str, value: str, ex: int = 3600):
        self.cache.set(key, value, ex=ex)

    def delete(self, key: str):
        self.cache.delete(key)

    def flush_all(self):
        self.cache.flushall()

    def get_all(self):
        keys = self.cache.keys("*")
        values = {}
        for key in keys:
            values[key] = self.cache.get(key)
        return values


# USAGE
# if __name__ == "__main__":
#     # testing the RedisCache class
#     import asyncio

#     redis_cache = RedisCache()

#     def test():
#         # Set a value with 10 sec expiration, check it with get, check it with all keys (should have 1 element), wait 11 sec and check again, then flush all, and check all keys to be empty
#         redis_cache.set("test_key", "test_value", ex=10)
#         print("Set key 'test_key' with value 'test_value' and expiration 10 sec")
#         value = redis_cache.get("test_key")
#         print(f"Get key 'test_key': {value}")

#         assert value == "test_value"

#         all_values = redis_cache.get_all()
#         print(f"All values: {all_values}")

#         assert len(all_values) == 1
#         assert all_values["test_key"] == "test_value"

#         print("Waiting 11 seconds for key to expire...")
#         asyncio.run(asyncio.sleep(11))

#         value = redis_cache.get("test_key")
#         print(f"Get key 'test_key' after expiration: {value}")
#         assert value is None

#         all_values = redis_cache.get_all()
#         print(f"All values after expiration: {all_values}")
#         assert len(all_values) == 0

#         redis_cache.set("key_50", "test_value", ex=50)
#         value = redis_cache.get("key_50")
#         print(f"Get key 'key_50': {value}")
#         assert value == "test_value"

#         redis_cache.flush_all()
#         print("Flushed all keys")
#         all_values = redis_cache.get_all()
#         print(f"All values after flush: {all_values}")

#         assert len(all_values) == 0
#         assert all_values == {}

#     test()
