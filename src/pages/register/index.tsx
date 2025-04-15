import React from "react";
import { useRegister } from "@refinedev/core";
import { Link, useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Layout as AntdLayout,
  Card,
  Form,
  Input,
  Button,
  Typography,
} from "antd";
import "./style.css";

const { Text, Title } = Typography;

export const Register: React.FC = () => {
  const { mutate: register, isLoading } = useRegister();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleRegister = (values: {
    username: string;
    password: string;
    confirmPassword: string;
  }) => {
    const { username, password, confirmPassword } = values;

    if (password !== confirmPassword) {
      form.setFields([
        { name: "confirmPassword", errors: ["Mật khẩu nhập lại không khớp"] },
      ]);
      return;
    }

    register(
      { username, password },
      {
        onSuccess: (data) => {
          if (data.success) {
            navigate("/ban-do");
          } else {
            form.setFields([
              {
                name: "username",
                errors: ["Đăng ký thất bại, vui lòng thử lại"],
              },
            ]);
          }
        },
        onError: (error) => {
          form.setFields([
            {
              name: "username",
              errors: [
                error.message || "Đăng ký thất bại, vui lòng thử lại",
              ],
            },
          ]);
        },
      }
    );
  };

  return (
    <AntdLayout className="layout">
      <Row justify="center" align="middle" style={{ height: "100vh" }}>
        <Col xs={22} sm={12} md={8}>
          <div className="container">
            {/* Logo và tiêu đề, giống trang Login */}
            <div className="imageContainer">
              <Link to="/ban-do">
                <img src="/images/logo2.png" alt="Logo" height={100} />
              </Link>
            </div>
            {/* Thẻ Card đăng ký */}
            <Card
              title={
                <Title level={3} className="title">
                  Đăng ký
                </Title>
              }
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleRegister}
                requiredMark={false}
              >
                <Form.Item
                  name="username"
                  label="Tài khoản"
                  rules={[{ required: true, message: "Vui lòng nhập tài khoản" }]}
                >
                  <Input size="large" placeholder="Tài khoản" />
                </Form.Item>
                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
                >
                  <Input.Password size="large" placeholder="Mật khẩu" />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="Nhập lại mật khẩu"
                  dependencies={["password"]}
                  rules={[
                    { required: true, message: "Vui lòng nhập lại mật khẩu" },
                  ]}
                >
                  <Input.Password size="large" placeholder="Nhập lại mật khẩu" />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    block
                    loading={isLoading}
                  >
                    Đăng ký
                  </Button>
                </Form.Item>
              </Form>
              <div style={{ marginTop: 8, textAlign: "center" }}>
                <Text style={{ fontSize: 12 }}>
                  Đã có tài khoản? <Link to={`/login?to=${encodeURIComponent("/register")}`}>Đăng nhập</Link>
                </Text>
              </div>
              <div style={{ marginTop: 8, textAlign: "center" }}>
                <Text style={{ fontSize: 12 }}>
                  <Link to="/ban-do">Quay về trang bản đồ</Link>
                </Text>
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </AntdLayout>
  );
};
