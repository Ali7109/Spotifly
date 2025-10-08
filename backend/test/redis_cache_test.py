import time
import pytest
from RedisCache import RedisCache


@pytest.fixture(scope="module")
def redis_cache():
    cache = RedisCache()
    cache.flush_all()  # start fresh
    return cache


def test_set_and_get(redis_cache):
    redis_cache.set("test_key", "test_value", ex=10)
    value = redis_cache.get("test_key")
    assert value == "test_value"


def test_get_all(redis_cache):
    all_values = redis_cache.get_all()
    assert "test_key" in all_values
    assert all_values["test_key"] == "test_value"


def test_expiration(redis_cache):
    redis_cache.set("expire_key", "will_expire", ex=3)
    time.sleep(4)
    value = redis_cache.get("expire_key")
    assert value is None


def test_flush(redis_cache):
    redis_cache.set("flush_key", "temp_value", ex=50)
    redis_cache.flush_all()
    all_values = redis_cache.get_all()
    assert all_values == {}
