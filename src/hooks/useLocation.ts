import { useEffect, useState, useRef } from "react";
import { notification } from "antd";

export const useUserLocation = () => {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      notification.error({
        message: "Trình duyệt không hỗ trợ định vị!",
      });
      return;
    }

    let shownAccuracyWarning = false;

    const startWatching = () => {
      // Hủy watchId cũ nếu có
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };

          if (position.coords.accuracy > 1000) {
            if (!shownAccuracyWarning) {
              notification.error({
                message: "Vị trí không đủ chính xác!",
                description: `Accuracy: ${position.coords.accuracy}m`,
              });
              shownAccuracyWarning = true;
            }
            return;
          }

          shownAccuracyWarning = false;
          setUserLocation(loc);
          retryCount.current = 0;
        },
        (error) => {
          console.error("Lỗi định vị:", error.message);
          notification.warning({
            message: "Không thể lấy vị trí của bạn! Thử lại...",
            description: `Lỗi: ${error.message}`,
          });

          if (error.code === error.PERMISSION_DENIED) {
            notification.error({
              message: "Quyền truy cập vị trí bị từ chối. Vui lòng bật trong cài đặt!",
            });
            return;
          }

          if (retryCount.current < maxRetries) {
            retryCount.current += 1;
            setTimeout(startWatching, 5000);
          } else {
            notification.error({
              message: "Không thể lấy vị trí sau nhiều lần thử!",
            });
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    // Kiểm tra quyền trước khi gọi watchPosition
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((permission) => {
        if (permission.state === "denied") {
          notification.error({
            message: "Quyền truy cập vị trí bị từ chối. Vui lòng bật trong cài đặt!",
          });
        } else if (permission.state === "granted" || permission.state === "prompt") {
          startWatching();
        }
        permission.onchange = () => {
          if (permission.state === "granted") {
            startWatching();
          }
        };
      });
    } else {
      startWatching();
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return userLocation;
};