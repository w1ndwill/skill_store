"""Native desktop window integration helpers."""

import ctypes
import time


def set_window_icon(icon_path: str, title: str = "SkillHub") -> None:
    """Set large and small Win32 window icons after PyWebView creates the HWND."""
    try:
        user32 = ctypes.windll.user32
        hwnd = None
        for _ in range(10):
            hwnd = user32.FindWindowW(None, title)
            if hwnd:
                break
            time.sleep(0.3)
        if not hwnd:
            return
        image_icon = 1
        load_from_file = 0x00000010
        wm_seticon = 0x0080
        large_icon = user32.LoadImageW(
            0, icon_path, image_icon, 48, 48, load_from_file
        )
        small_icon = user32.LoadImageW(
            0, icon_path, image_icon, 16, 16, load_from_file
        )
        if large_icon:
            user32.SendMessageW(hwnd, wm_seticon, 1, large_icon)
        if small_icon:
            user32.SendMessageW(hwnd, wm_seticon, 0, small_icon)
    except Exception:
        pass
