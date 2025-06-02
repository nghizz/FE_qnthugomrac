// src/components/common/UI/input-form/form.tsx
import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, notification } from "antd"; // Thêm notification nếu chưa có
import type { Feature } from "ol";
import type { Point } from "ol/geom";

export interface InputPointFormValues {
  name: string;
  type: string;
  frequency: number;
}

interface InputPointFormProps {
  visible: boolean;
  feature: Feature<Point> | null;
  mode?: "add" | "update";
  onSubmit: (feature: Feature<Point>, values: InputPointFormValues) => void;
  onCancel: () => void;
}

const InputPointForm: React.FC<InputPointFormProps> = ({
  visible,
  feature,
  mode,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm<InputPointFormValues>();

  useEffect(() => {
    if (visible) {
      if (mode === "update" && feature) {
        // *** BẮT ĐẦU PHẦN CẦN KIỂM TRA VÀ SỬA ***
        // Lấy dữ liệu từ feature. Sử dụng tên thuộc tính thực tế bạn thấy trong console log!
        // Ví dụ: nếu tên là 'ten_diem', loại là 'loai_diem', tần suất là 'tan_suat'
        const featureName = feature.get("name");         // ĐỔI THÀNH feature.get("ten_diem") NẾU CẦN
        const featureType = feature.get("type");         // ĐỔI THÀNH feature.get("loai_diem") NẾU CẦN
        const featureFrequency = feature.get("frequency"); // ĐỔI THÀNH feature.get("tan_suat") NẾU CẦN
        // *** KẾT THÚC PHẦN CẦN KIỂM TRA VÀ SỬA ***

        console.log("InputPointForm - Update Mode - Feature Data:", {
            name_expected: featureName,    // Giá trị đọc được với tên "name"
            type_expected: featureType,    // Giá trị đọc được với tên "type"
            frequency_expected: featureFrequency, // Giá trị đọc được với tên "frequency"
            allProps: feature.getProperties() // Log tất cả thuộc tính để kiểm tra
        });

        // Đặt giá trị cho form. Key ở đây ('name', 'type', 'frequency')
        // phải khớp với thuộc tính 'name' của các <Form.Item> bên dưới.
        form.setFieldsValue({
          name: featureName,        // Sử dụng giá trị đã lấy ở trên
          type: featureType,        // Sử dụng giá trị đã lấy ở trên
          frequency: featureFrequency // Sử dụng giá trị đã lấy ở trên
        });
      } else {
        console.log("InputPointForm - Resetting fields");
        form.resetFields();
      }
    }
  }, [feature, mode, form, visible]);

  const handleFinish = (values: InputPointFormValues) => {
    if (!feature) {
       console.error("InputPointForm - handleFinish called without a feature!");
       notification.error({ message: "Lỗi", description: "Không có thông tin điểm để gửi đi." });
       return;
    }
    // Dữ liệu `values` ở đây sẽ có key là 'name', 'type', 'frequency'
    // do được lấy từ các <Form.Item name="...">
    console.log("InputPointForm - Submitting values:", values);
    onSubmit(feature, values);
  };

  return (
    <Modal
      title={
        mode === "update"
          ? "Cập nhật thông tin điểm thu gom"
          : "Nhập thông tin điểm thu gom"
      }
      visible={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={mode === "update" ? "Cập nhật điểm" : "Thêm điểm"}
      cancelText="Hủy"
      destroyOnClose // Giữ lại để reset form khi đóng
    >
      {/* Các Form.Item phải có thuộc tính 'name' khớp với key trong form.setFieldsValue */}
      <Form form={form} layout="vertical" name="input_point_form" onFinish={handleFinish}>
        <Form.Item
          name="name" // Khớp với key 'name'
          label="Tên điểm"
          rules={[{ required: true, message: "Vui lòng nhập tên điểm" }]}
        >
          <Input placeholder="Nhập tên điểm thu gom" />
        </Form.Item>
        <Form.Item
          name="type" // Khớp với key 'type'
          label="Loại điểm"
          rules={[{ required: true, message: "Vui lòng chọn loại điểm" }]}
        >
          <Select placeholder="Chọn loại điểm thu gom">
            <Select.Option value="Hữu Cơ">Hữu Cơ</Select.Option>
            <Select.Option value="Vô Cơ">Vô Cơ</Select.Option>
            <Select.Option value="Tái Chế">Tái Chế</Select.Option>
            {/* Thêm các loại khác nếu cần */}
          </Select>
        </Form.Item>
        <Form.Item
          name="frequency" // Khớp với key 'frequency'
          label="Tần suất (lần/tuần)"
          rules={[{ required: true, message: "Vui lòng nhập tần suất" }]}
        >
          <InputNumber
            min={1}
            style={{ width: "100%" }}
            placeholder="Nhập số lần thu gom mỗi tuần"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InputPointForm;