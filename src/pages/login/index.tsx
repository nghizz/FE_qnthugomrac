import React from "react";
import { useLogin } from "@refinedev/core";
import {
  Row,
  Col,
  Layout as AntdLayout,
  Card,
  Typography,
  Form,
  Input,
  Button,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import "./style.css";

const { Title, Text } = Typography;

export interface ILoginForm {
  username: string;
  password: string;
}

export const Login: React.FC = () => {
  const [form] = Form.useForm<ILoginForm>();
  const { mutate: login, isLoading } = useLogin<ILoginForm>();
  const navigate = useNavigate();

  const CardTitle = (
    <Title level={3} className="title">
      Đăng nhập
    </Title>
  );

  const handleLogin = (values: ILoginForm) => {
    login(
      { username: values.username, password: values.password },
      {
        onSuccess: (data) => {
          if (data.success) {
            navigate("/ban-do");
          } else {
            form.setFields([
              {
                name: "password",
                errors: ["Tài khoản hoặc mật khẩu không đúng"],
              },
            ]);
          }
        },
        onError: (error) => {
          console.error("Login error:", error);
        },
      }
    );
  };

  return (
    <AntdLayout className="layout">
      <Row justify="center" align="middle" style={{ height: "100vh" }}>
        <Col xs={22} sm={12} md={8}>
          <div className="container">
            <div className="imageContainer">
              <Link to="/ban-do">
                <img src="/images/logo2.png" alt="Logo" height={100} />
              </Link>
            </div>
            <Card
              title={CardTitle}
              style={{ paddingTop: 32, paddingBottom: 32 }}
              styles={{ header: { borderBottom: 0 } }}
            >
              <Form<ILoginForm>
                layout="vertical"
                form={form}
                onFinish={handleLogin}
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
                  <Input.Password
                    size="large"
                    placeholder="Mật khẩu"
                    autoComplete="current-password"
                  />
                </Form.Item>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  block
                  loading={isLoading}
                >
                  Đăng nhập
                </Button>
              </Form>
              <div style={{ marginTop: 8, textAlign: "center" }}>
                <Text style={{ fontSize: 12 }}>
                  Chưa có tài khoản? <Link to={`/register?to=${encodeURIComponent("/login")}`}>Đăng ký</Link>
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
