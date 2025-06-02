import React, { useState } from "react";
import { Input, Button, Select, Spin, Pagination, Row, Col } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import "./styles/searchPopup.css";
import { POINT_TYPES } from "../../../../constants";

const { Option } = Select;
const PAGE_SIZE = 10;

export type SearchPoint = {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
};

type SearchPopupProps = {
  onClose: () => void;
  onSearch: (keyword: string, pointType: string) => void;
  onSearchNearby: (pointType: string) => void;
  searchResults: SearchPoint[];
  isLoading: boolean;
  onSelectPoint: (p: SearchPoint) => void;
};

const SearchPopup: React.FC<SearchPopupProps> = ({
  onClose,
  onSearch,
  onSearchNearby,
  searchResults,
  isLoading,
  onSelectPoint,
}) => {
  const [keyword, setKeyword] = useState("");
  const [pointType, setPointType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageData = searchResults.slice(start, end);

  const doSearch = () => {
    setCurrentPage(1);
    onSearch(keyword, pointType);
  };

  const doNearby = () => {
    setCurrentPage(1);
    onSearchNearby(pointType);
  };

  return (
    <div className="search-popup-drawer">
      <div className="search-popup-header">
        <h3>Tìm kiếm điểm</h3>
        <Button type="text" onClick={onClose}>
          Đóng
        </Button>
      </div>

      <div className="search-popup-content">
        <div className="search-popup-row">
          <Input
            placeholder="Nhập từ khóa..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={doSearch}
          />
        </div>

        <div className="search-popup-row">
          <Select
            value={pointType}
            onChange={(v) => setPointType(v)}
            style={{ width: 120 }}
            getPopupContainer={() => document.body}
          >
            {POINT_TYPES.map((t) => (
              <Option key={t.value} value={t.value}>
                {t.label}
              </Option>
            ))}
          </Select>
          <Button icon={<FilterOutlined />} onClick={doNearby}>
            Gần nhất
          </Button>
          <Button type="primary" onClick={doSearch}>
            Tìm kiếm
          </Button>
        </div>

        {/* BODY chỉ scroll nội dung */}
        <div className="search-popup-body">
          {isLoading ? (
            <Spin style={{ margin: "8px 0" }} />
          ) : pageData.length > 0 ? (
            <>
              <b>Kết quả tìm được:</b>
              <Row gutter={[0, 8]} style={{ marginTop: 8 }}>
                {pageData.map((pt) => (
                  <Col
                    key={pt.id}
                    span={24}
                    className="search-popup-item"
                    onClick={() => onSelectPoint(pt)}
                  >
                    <Row>
                      <Col span={10}>{pt.name}</Col>
                      <Col span={4} style={{ textAlign: "center" }}>
                        -
                      </Col>
                      <Col span={10}>{pt.type}</Col>
                    </Row>
                  </Col>
                ))}
              </Row>
            </>
          ) : (
            <div className="no-results">Không tìm thấy kết quả nào.</div>
          )}
        </div>

        {/* FOOTER luôn nằm dưới cùng */}
        <div className="search-popup-footer">
          <Pagination
            current={currentPage}
            pageSize={PAGE_SIZE}
            total={searchResults.length}
            onChange={(p) => setCurrentPage(p)}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchPopup;
