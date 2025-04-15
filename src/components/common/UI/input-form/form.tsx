// src/components/UI/input-form.tsx
import React, { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select } from "antd";
import type { Feature } from "ol";
import type { Point } from "ol/geom";

/**
 * Interface defining the structure of form values
 */
export interface InputPointFormValues {
  name: string;
  type: string;
  frequency: number;
}

/**
 * Props interface for the InputPointForm component
 */
interface InputPointFormProps {
  visible: boolean;
  feature: Feature<Point> | null;
  mode: "add" | "update";
  onSubmit: (feature: Feature<Point>, values: InputPointFormValues) => void;
  onCancel: () => void;
}

/**
 * Form component for adding or updating collection points
 * @param props Component props
 * @returns React component
 */
const InputPointForm: React.FC<InputPointFormProps> = ({
  visible,
  feature,
  mode,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm<InputPointFormValues>();

  /**
   * Effect to handle form initialization and updates
   * Sets form values when in update mode or resets form when in add mode
   */
  useEffect(() => {
    if (mode === "update" && feature) {
      form.setFieldsValue({
        name: feature.get("name"),
        type: feature.get("type"),
        frequency: feature.get("frequency"),
      });
    } else {
      form.resetFields();
    }
  }, [feature, mode, form, visible]);

  /**
   * Handles form submission
   * @param values Form values
   */
  const handleFinish = (values: InputPointFormValues) => {
    if (!feature) return;
    onSubmit(feature, values);
  };

  return (
    <Modal
      title={
        mode === "update"
          ? "Cập nhật thông tin điểm thu gom"
          : "Nhập thông tin điểm thu gom"
      }
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={mode === "update" ? "Cập nhật điểm" : "Thêm điểm"}
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="name"
          label="Tên điểm"
          rules={[{ required: true, message: "Vui lòng nhập tên điểm" }]}
        >
          <Input placeholder="Nhập tên điểm thu gom" />
        </Form.Item>
        <Form.Item
          name="type"
          label="Loại điểm"
          rules={[{ required: true, message: "Vui lòng chọn loại điểm" }]}
        >
          <Select placeholder="Chọn loại điểm thu gom">
            <Select.Option value="Hữu Cơ">Hữu Cơ</Select.Option>
            <Select.Option value="Vô Cơ">Vô Cơ</Select.Option>
            <Select.Option value="Tái Chế">Tái Chế</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="frequency"
          label="Tần suất"
          rules={[{ required: true, message: "Vui lòng nhập tần suất" }]}
        >
          <InputNumber 
            min={1} 
            style={{ width: "100%" }} 
            placeholder="Nhập tần suất thu gom"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InputPointForm;
