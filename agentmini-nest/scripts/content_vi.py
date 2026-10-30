"""Nội dung tiếng Việt cho báo cáo dự án AgentMini-Nest — bản chi tiết.

Mỗi mục có 3-6 đoạn văn dày, code listing minh họa, bảng so sánh chi tiết.
Tổng cộng 11 chương + phụ lục, hướng tới một báo cáo đồ án tốt nghiệp khoảng
35-45 trang in.
"""
from __future__ import annotations

from pathlib import Path

from report_builder import (CodeListingSpec, FigureSpec, Report, Section,
                             TableSpec)

FIG_DIR = Path(__file__).resolve().parent.parent / "docs" / "figures"


def get_report() -> Report:
    chapters = [
        _ch1(), _ch2(), _ch3(), _ch4(), _ch5(),
        _ch6(), _ch7(), _ch8(), _ch9(), _ch10(),
        _ch11(), _appendix(),
    ]
    return Report(
        title="AgentMini-Nest",
        subtitle="Máy chủ tác tử AI tối giản dựa trên NestJS — hỗ trợ gọi công cụ, lưu phiên hội thoại và nén ngữ cảnh",
        author="Sinh viên thực hiện: <Họ và tên>          Giảng viên hướng dẫn: <Họ và tên>",
        institution="Trường Đại học – Khoa Công nghệ Thông tin",
        year="Năm học 2025 – 2026",
        abstract=(
            "Báo cáo trình bày quá trình phân tích, thiết kế và triển khai một máy chủ tác "
            "tử trí tuệ nhân tạo có tên AgentMini-Nest. Hệ thống áp dụng kiến trúc đơn "
            "giản hóa dựa trên hàm sinh bất đồng bộ để mô phỏng vòng lặp tác tử trong các "
            "sản phẩm thương mại như Claude Code và LangGraph, đồng thời giữ phạm vi gọn "
            "nhẹ và tự chứa, không phụ thuộc vào các thư viện khung lớn. Hệ thống cung "
            "cấp mười hai công cụ cốt lõi cho thao tác hệ tệp, vỏ lệnh, truy cập mạng và "
            "quản lý danh mục công việc; tám lệnh điều khiển hội thoại; cơ chế nén ngữ "
            "cảnh tự động khi tổng số mã thông báo vượt một trăm bảy mươi mốt nghìn; tầng "
            "lưu trữ phiên hội thoại theo định dạng JSONL trên đĩa cho phép khôi phục sau "
            "khi máy chủ khởi động lại; bản đồ phiên theo khách hàng cho phép tự động duy "
            "trì mạch hội thoại mà người dùng không cần truyền lại định danh phiên; cơ "
            "chế truyền tín hiệu hủy đầu cuối từ tầng giao diện HTTP xuống tận từng công "
            "cụ; và bộ chống lặp lời gọi công cụ giúp ngăn các mô hình yếu rơi vào trạng "
            "thái lặp vô tận. Toàn bộ mã nguồn được viết bằng TypeScript trên khung "
            "NestJS với khoảng ba nghìn dòng và đã được kiểm thử qua bảy kịch bản khói, "
            "ba kịch bản nén, hai kịch bản hủy giữa chừng và một kịch bản chống lặp với "
            "kết quả thành công. Báo cáo so sánh phương án xây dựng với Claude Code, "
            "LangChain và OpenAI Assistants, phân tích các đánh đổi trong thiết kế, đồng "
            "thời chỉ ra hướng mở rộng tiếp theo bao gồm hỗ trợ giao thức Model Context "
            "Protocol, sinh tác tử con qua công cụ Task, tích hợp tìm kiếm theo véc-tơ "
            "và lớp xác thực cho triển khai đa người dùng."
        ),
        keywords=[
            "tác tử AI", "NestJS", "gọi công cụ", "hàm sinh bất đồng bộ",
            "nén ngữ cảnh", "máy chủ luồng SSE", "lưu trữ phiên hội thoại",
            "TypeScript", "kiến trúc tiêm phụ thuộc", "Model Context Protocol",
        ],
        table_label="Bảng",
        figure_label="Hình",
        abstract_label="Tóm tắt",
        keywords_label="Từ khóa",
        toc_label="Mục lục",
        list_tables_label="Danh mục bảng",
        list_figures_label="Danh mục hình",
        references_label="Tài liệu tham khảo",
        references=_references(),
        chapters=chapters,
        acknowledgement_title="Lời cảm ơn",
        acknowledgement_text=(
            "Trước hết, em xin gửi lời cảm ơn chân thành đến giảng viên hướng dẫn đã "
            "tận tình chỉ bảo và đồng hành cùng em trong suốt quá trình thực hiện đề "
            "tài. Những góp ý và định hướng kịp thời của thầy/cô là nguồn động viên "
            "lớn giúp em hoàn thành báo cáo này.\n\n"
            "Em cũng xin cảm ơn các thầy cô trong Khoa Công nghệ Thông tin đã trang "
            "bị cho em nền tảng kiến thức vững chắc trong suốt những năm học vừa qua. "
            "Cảm ơn gia đình, bạn bè đã luôn ủng hộ và chia sẻ trong những giai đoạn "
            "khó khăn của quá trình học tập.\n\n"
            "Mặc dù đã cố gắng hoàn thiện đề tài một cách tốt nhất, do thời gian và "
            "kinh nghiệm còn hạn chế, báo cáo không tránh khỏi những thiếu sót. Em "
            "rất mong nhận được sự nhận xét và góp ý quý báu của các thầy cô để đề "
            "tài được hoàn thiện hơn."
        ),
        declaration_title="Lời cam đoan",
        declaration_text=(
            "Em xin cam đoan đồ án tốt nghiệp với đề tài AgentMini-Nest là công trình "
            "nghiên cứu của riêng em dưới sự hướng dẫn của giảng viên. Toàn bộ mã "
            "nguồn, tài liệu thiết kế và nội dung báo cáo do em tự thực hiện. Các "
            "tham khảo từ tài liệu của Anthropic, OpenAI, NestJS và các dự án mã "
            "nguồn mở khác đã được trích dẫn đầy đủ trong phần tài liệu tham khảo. "
            "Nếu có bất kỳ vi phạm nào về tính trung thực học thuật, em xin chịu hoàn "
            "toàn trách nhiệm."
        ),
        abbreviations_title="Danh mục từ viết tắt",
        abbreviations=[
            ("AI", "Artificial Intelligence — Trí tuệ nhân tạo"),
            ("API", "Application Programming Interface — Giao diện lập trình ứng dụng"),
            ("CLI", "Command-Line Interface — Giao diện dòng lệnh"),
            ("DI", "Dependency Injection — Tiêm phụ thuộc"),
            ("HTTP", "Hypertext Transfer Protocol — Giao thức truyền tải siêu văn bản"),
            ("HTTPS", "HTTP Secure — HTTP qua kết nối TLS/SSL"),
            ("JSON", "JavaScript Object Notation — Định dạng dữ liệu JavaScript Object Notation"),
            ("JSONL", "JSON Lines — Định dạng JSON một dòng một bản ghi"),
            ("JWT", "JSON Web Token — Thẻ xác thực dạng JSON"),
            ("LLM", "Large Language Model — Mô hình ngôn ngữ lớn"),
            ("MCP", "Model Context Protocol — Giao thức ngữ cảnh mô hình"),
            ("REST", "Representational State Transfer — Phong cách kiến trúc dịch vụ web"),
            ("SDK", "Software Development Kit — Bộ công cụ phát triển phần mềm"),
            ("SSE", "Server-Sent Events — Luồng sự kiện máy chủ"),
            ("TTL", "Time To Live — Thời gian sống"),
            ("UML", "Unified Modeling Language — Ngôn ngữ mô hình hóa thống nhất"),
            ("URL", "Uniform Resource Locator — Định vị tài nguyên thống nhất"),
            ("UUID", "Universally Unique Identifier — Định danh duy nhất toàn cầu"),
        ],
    )


# ── Chương 1: Mở đầu ─────────────────────────────────────────────────────────

def _ch1() -> Section:
    s = Section(title="Chương 1: Mở đầu", level=1)

    s.children.append(Section(
        title="1.1. Bối cảnh nghiên cứu", level=2,
        paragraphs=[
            "Trong vài năm gần đây, các mô hình ngôn ngữ lớn đã phát triển rất nhanh "
            "từ các bộ tóm tắt văn bản đơn thuần thành các tác tử có khả năng gọi công "
            "cụ để thực thi các tác vụ cụ thể như đọc và ghi tệp, chạy lệnh hệ thống, "
            "tra cứu thông tin trên mạng hay quản lý danh sách công việc. Khả năng gọi "
            "công cụ được tiêu chuẩn hóa qua đặc tả của OpenAI và được hỗ trợ trên "
            "nhiều nền tảng, mở ra một mô hình tương tác mới: mô hình ngôn ngữ không "
            "còn chỉ trả lời câu hỏi mà còn chủ động phối hợp với các thành phần phần "
            "mềm khác để hoàn thành nhiệm vụ.",

            "Sự xuất hiện của các sản phẩm thương mại như Claude Code, Cursor, GitHub "
            "Copilot Workspace và OpenAI Assistants cho thấy mô hình giao tiếp người-"
            "máy đang dịch chuyển sang dạng tác tử có công cụ. Các sản phẩm này phối "
            "hợp ba thành phần chính: một mô hình ngôn ngữ làm bộ não, một bộ công cụ "
            "có thể gọi được, và một vòng lặp điều phối có khả năng duy trì trạng "
            "thái, kiểm soát lỗi và quản lý ngữ cảnh. Mỗi thành phần đặt ra những "
            "thách thức kỹ thuật riêng, từ tốc độ truyền luồng đến giới hạn cửa sổ "
            "ngữ cảnh, từ an toàn khi chạy mã trên máy người dùng đến khả năng chịu "
            "lỗi khi mô hình ngắt kết nối hoặc trả về dữ liệu không hợp lệ.",

            "Tuy nhiên, phần lớn các sản phẩm thương mại đều đóng kín mã nguồn hoặc "
            "dựa trên các thư viện khung như LangChain, LangGraph có lượng phụ thuộc "
            "rất lớn và cấu hình phức tạp. Đối với người học hoặc đội nhóm muốn hiểu "
            "sâu cơ chế bên trong một tác tử AI, việc xây dựng lại hệ thống từ các "
            "thành phần cơ bản mang lại giá trị giáo dục và thực tiễn cao hơn so với "
            "chỉ dùng thư viện sẵn có.",

            "Hơn nữa, mỗi tổ chức có yêu cầu đặc thù về bảo mật, nhật ký và tích hợp "
            "với hạ tầng nội bộ; một hệ thống tự chủ về kiến trúc dễ thích nghi với "
            "các yêu cầu này hơn so với một thư viện đa năng. Ví dụ, một số tổ chức "
            "yêu cầu mọi cuộc hội thoại được lưu trữ trên đĩa cục bộ phục vụ kiểm "
            "toán; một số khác yêu cầu sandbox cho các lệnh Bash chạy trong môi "
            "trường tách biệt. Những yêu cầu này khó đáp ứng nếu chỉ sử dụng một dịch "
            "vụ đám mây như OpenAI Assistants.",

            "Ở góc độ đào tạo, đề tài cung cấp một sản phẩm tham khảo có cấu trúc "
            "đủ nhỏ để được đọc trong một học phần đại học, nhưng đủ đầy đủ để minh "
            "họa tất cả các thành phần cốt lõi của một tác tử AI thật. Đây là điểm "
            "khác biệt rõ rệt so với các bản triển khai tối giản chỉ minh họa một "
            "vài tính năng đơn lẻ.",
        ],
    ))

    s.children.append(Section(
        title="1.2. Vấn đề cần giải quyết", level=2,
        paragraphs=[
            "Khi xây dựng một tác tử AI có công cụ, các vấn đề kỹ thuật cần giải "
            "quyết bao gồm: thiết kế giao diện công cụ thống nhất cho phép thêm mới "
            "dễ dàng, định nghĩa giao thức luồng truyền sự kiện đến khách hàng để mọi "
            "phản hồi xuất hiện theo thời gian thực, đảm bảo an toàn khi mô hình "
            "phát ra dữ liệu không hợp lệ, kiểm soát chi phí mã thông báo khi cuộc "
            "hội thoại kéo dài, lưu trữ và khôi phục lịch sử hội thoại trước các "
            "tình huống khởi động lại, và bảo đảm tài nguyên được giải phóng khi "
            "khách hàng ngắt kết nối giữa chừng.",

            "Mỗi vấn đề đều có nhiều phương án giải. Việc lựa chọn phương án phù "
            "hợp với phạm vi và quy mô là một bài toán thiết kế thực tế. AgentMini-"
            "Nest đưa ra một bộ lựa chọn nhất quán cho các vấn đề kể trên: dùng hàm "
            "sinh bất đồng bộ cho vòng lặp tác tử, dùng tiêm phụ thuộc của NestJS "
            "cho đăng ký công cụ, dùng JSONL cho lưu trữ, dùng AbortController cho "
            "tín hiệu hủy, và dùng Zod cho kiểm chứng đầu vào.",
        ],
    ))

    s.children.append(Section(
        title="1.3. Mục tiêu cụ thể", level=2,
        paragraphs=[
            "Trên cơ sở các vấn đề đã nêu, đề tài đặt ra các mục tiêu cụ thể như sau:",
        ],
        bullets=[[
            "Cung cấp giao diện HTTP truyền luồng sự kiện máy chủ (Server-Sent Events) "
            "cho phép khách hàng nhận từng đoạn văn bản, từng lời gọi công cụ và từng "
            "kết quả tương ứng theo thời gian thực, không cần WebSocket.",

            "Tổ chức công cụ theo mô hình cắm-rút thông qua bộ tiêm phụ thuộc của "
            "NestJS, sao cho việc thêm một công cụ mới chỉ cần đăng ký một lớp dịch "
            "vụ và không cần sửa đổi lõi xử lý của hệ thống.",

            "Bảo đảm khả năng chịu lỗi: khi mô hình ngôn ngữ ngắt kết nối tạm thời, "
            "khi công cụ phát sinh ngoại lệ, khi đầu vào không hợp lệ, hay khi người "
            "dùng đóng kết nối, hệ thống vẫn duy trì trạng thái nhất quán và không "
            "rò rỉ tài nguyên.",

            "Triển khai cơ chế nén ngữ cảnh tự động và thủ công, cho phép phiên hội "
            "thoại dài duy trì hoạt động trong giới hạn cửa sổ ngữ cảnh của mô hình.",

            "Lưu trữ phiên hội thoại trên đĩa theo định dạng JSONL có thể đọc bằng "
            "mắt thường, hỗ trợ khôi phục sau khi máy chủ khởi động lại và xuất bản "
            "lại lịch sử cho người dùng dưới dạng JSON.",

            "Hỗ trợ tự động duy trì phiên: khách hàng có thể gọi nhiều lần liên tiếp "
            "mà không cần chủ động truyền sessionId; hệ thống tự khớp phiên gần nhất "
            "theo từng khách hàng dựa trên kết hợp địa chỉ IP và User-Agent.",

            "Cung cấp hệ thống lệnh hội thoại bắt đầu bằng dấu gạch chéo cho các "
            "thao tác siêu dữ liệu như xem chi phí, nén ngữ cảnh, xóa phiên, liệt "
            "kê công cụ và xuất bản lịch sử.",

            "Cấu trúc mã nguồn rõ ràng theo nguyên tắc một mô-đun một trách nhiệm "
            "để dễ đọc, dễ kiểm thử và dễ mở rộng cho các đề tài tiếp theo.",

            "Cung cấp công cụ dòng lệnh kèm theo cho phép người dùng tương tác "
            "thuận tiện mà không phải gõ lệnh curl phức tạp.",
        ]],
    ))

    s.children.append(Section(
        title="1.4. Phạm vi và giới hạn", level=2,
        paragraphs=[
            "Hệ thống tập trung vào các trường hợp sử dụng đơn người dùng đến đa "
            "người dùng quy mô nhỏ trong môi trường phát triển hoặc nội bộ. Phạm vi "
            "không bao gồm các yêu cầu của hệ thống thương mại quy mô lớn như xác "
            "thực bằng OAuth hoặc khóa API, phân tải nhiều phiên bản, cô lập sandbox "
            "cho từng phiên, quản lý hạn ngạch thanh toán hay nhật ký kiểm toán theo "
            "chuẩn doanh nghiệp.",

            "Đề tài cũng không xây dựng giao diện đồ họa cho người dùng cuối, do "
            "trọng tâm là phía máy chủ. Một tệp HTML đơn giản dùng cho kiểm thử có "
            "thể được phát triển nhanh chóng dựa trên giao diện luồng sự kiện máy "
            "chủ đã định nghĩa, nhưng không nằm trong phạm vi báo cáo.",

            "Giao thức Model Context Protocol và việc sinh tác tử con qua công cụ "
            "Task được liệt kê là hướng phát triển trong chương kết luận. Tích hợp "
            "với cơ sở dữ liệu véc-tơ chỉ được nêu định hướng và không cài đặt, vì "
            "các trường hợp sử dụng phổ biến hiện tại của tác tử mã nguồn không yêu "
            "cầu tìm kiếm theo ngữ nghĩa khi đã có Glob và Grep tận dụng được hệ "
            "thống tệp.",

            "Về mô hình ngôn ngữ, hệ thống chỉ kiểm thử với các điểm cuối tương "
            "thích OpenAI; các nhà cung cấp dùng giao thức khác như Anthropic gốc, "
            "Google Gemini hoặc Cohere không được hỗ trợ trực tiếp mà cần một lớp "
            "ánh xạ riêng, là phần việc của một đề tài mở rộng.",
        ],
    ))

    s.children.append(Section(
        title="1.5. Đóng góp của báo cáo", level=2,
        paragraphs=[
            "Báo cáo có ba đóng góp chính. Thứ nhất, nó cung cấp một bộ mã nguồn "
            "đầy đủ tính năng cốt lõi của một tác tử AI hiện đại, được tổ chức theo "
            "kiến trúc rõ ràng, phù hợp làm tài liệu tham chiếu cho các học phần "
            "phát triển ứng dụng AI ở bậc đại học. Thứ hai, báo cáo phân tích các "
            "quyết định thiết kế then chốt của hệ thống lớn như Claude Code và đối "
            "chiếu với các lựa chọn thay thế của thư viện LangChain, từ đó rút ra "
            "các bài học có thể tái sử dụng. Thứ ba, báo cáo trình bày kết quả "
            "kiểm thử thực nghiệm với mô hình kimi-k2.5 qua giao diện tương thích "
            "OpenAI, cho thấy các vấn đề thực tế của mô hình yếu (như lặp lời gọi "
            "công cụ) và cách giải quyết.",
        ],
    ))

    s.children.append(Section(
        title="1.6. Cấu trúc báo cáo", level=2,
        paragraphs=[
            "Phần còn lại của báo cáo được tổ chức thành mười một chương và một "
            "phụ lục. Chương 2 trình bày các cơ sở lý thuyết cần thiết. Chương 3 "
            "khảo sát các sản phẩm và thư viện tương tự. Chương 4 mô tả các yêu cầu "
            "chức năng, phi chức năng, các tác nhân và trường hợp sử dụng. Chương "
            "5 trình bày thiết kế kiến trúc với các sơ đồ thành phần, sơ đồ trình "
            "tự, sơ đồ trạng thái, sơ đồ lớp và sơ đồ triển khai. Chương 6 giới "
            "thiệu chi tiết triển khai với các đoạn mã đại diện. Chương 7 trình "
            "bày kế hoạch và kết quả kiểm thử. Chương 8 trình bày các vấn đề "
            "vận hành, triển khai, theo dõi và bảo trì. Chương 9 đánh giá hệ "
            "thống về chức năng, hiệu năng và khả năng chịu lỗi. Chương 10 đóng "
            "vai trò sách hướng dẫn sử dụng cho người dùng cuối. Chương 11 tổng "
            "kết và đề xuất hướng phát triển. Phụ lục liệt kê tham chiếu công cụ, "
            "lệnh, biến môi trường và điểm cuối HTTP.",
        ],
    ))
    return s


# ── Chương 2: Cơ sở lý thuyết ───────────────────────────────────────────────

def _ch2() -> Section:
    s = Section(title="Chương 2: Cơ sở lý thuyết", level=1)

    s.children.append(Section(
        title="2.1. Hàm sinh bất đồng bộ", level=2,
        paragraphs=[
            "Hàm sinh bất đồng bộ là một cơ chế ngôn ngữ trong JavaScript và "
            "TypeScript cho phép một hàm trả về nhiều giá trị theo thời gian thông "
            "qua kết hợp giữa từ khóa async và yield. Một hàm có dấu sao bất đồng "
            "bộ trả về một đối tượng thực hiện cả giao thức iterable bất đồng bộ "
            "và giao thức iterator bất đồng bộ. Phía tiêu thụ duyệt qua các giá "
            "trị bằng vòng lặp for await of; mỗi lần lặp tương ứng với một giá "
            "trị do phía sinh phát ra. Khi vòng lặp kết thúc, mọi tài nguyên do "
            "hàm sinh nắm giữ được giải phóng tự động bởi cơ chế dọn dẹp của ngôn "
            "ngữ.",

            "Khi áp dụng vào vòng lặp tác tử, hàm sinh bất đồng bộ giúp tách rời "
            "pha tạo sự kiện và pha tiêu thụ sự kiện. Mã tiêu thụ có thể tạm dừng, "
            "chuyển hướng, hoặc dừng hẳn vòng lặp mà không cần kiểm soát phức tạp "
            "ở phía hàm sinh. Nhờ vậy, các sự kiện luồng từ máy chủ AI cho đến "
            "luồng sự kiện máy chủ trả cho khách hàng có thể được trung chuyển "
            "trực tiếp mà không cần đệm trung gian.",

            "Khi khách hàng đóng kết nối, vòng for await of bị thoát và hàm sinh "
            "bị giải dọn, cho phép phía sinh nhận tín hiệu hủy và dừng các thao "
            "tác đang chạy. Trong dự án này, vòng lặp tác tử được định nghĩa là "
            "một hàm sinh bất đồng bộ trong lớp QueryService. Bộ điều khiển HTTP "
            "ChatController duyệt qua hàm sinh và đẩy từng sự kiện vào luồng sự "
            "kiện máy chủ tới khách hàng. Khi khách hàng đóng kết nối, một "
            "AbortController được kích hoạt; hàm sinh kiểm tra trạng thái này tại "
            "đầu mỗi lượt và thoát sạch sẽ.",

            "So với các phương án truyền thống dựa trên callback hoặc Promise, "
            "hàm sinh bất đồng bộ có ba ưu điểm quan trọng: mã đọc gần với mã "
            "tuần tự, dễ hiểu hơn; tài nguyên được giải phóng tự động qua cơ chế "
            "iterator return; và cho phép biểu diễn luồng dữ liệu không giới hạn "
            "kích thước mà không cần buffer toàn bộ. Đoạn mã minh họa dưới đây "
            "cho thấy một vòng lặp tối thiểu.",
        ],
        listings=[CodeListingSpec(
            caption="Khung tối thiểu của một vòng lặp tác tử dạng hàm sinh bất đồng bộ",
            language="TypeScript",
            code=(
                "async function* runAgent(messages, signal) {\n"
                "  for (let turn = 0; turn < MAX_TURNS; turn++) {\n"
                "    if (signal.aborted) break;\n"
                "    // 1. Gọi mô hình, tích lũy phản hồi qua luồng\n"
                "    for await (const chunk of aiClient.stream({ messages })) {\n"
                "      if (chunk.type === 'text_delta')\n"
                "        yield { type: 'text_delta', text: chunk.text };\n"
                "      else if (chunk.type === 'tool_call')\n"
                "        toolCalls.push(chunk);\n"
                "    }\n"
                "    if (toolCalls.length === 0) break;\n"
                "    // 2. Thực thi tất cả lời gọi công cụ\n"
                "    for (const tc of toolCalls) {\n"
                "      const result = await registry.execute(tc.name, tc.args, signal);\n"
                "      yield { type: 'tool_result', ...result };\n"
                "      messages.push({ role: 'tool', content: result.content,\n"
                "                       tool_call_id: tc.id });\n"
                "    }\n"
                "  }\n"
                "}"
            ),
        )],
    ))

    s.children.append(Section(
        title="2.2. Gọi công cụ trên các mô hình ngôn ngữ", level=2,
        paragraphs=[
            "Các mô hình ngôn ngữ thế hệ mới hỗ trợ gọi công cụ thông qua một định "
            "dạng đặc tả công cụ kiểu OpenAI, gồm tên hàm, mô tả và lược đồ JSON "
            "cho tham số đầu vào. Mô hình quyết định khi nào gọi công cụ dựa trên "
            "ngữ cảnh hội thoại; khi cần gọi, nó phát ra một khối tool_call chứa "
            "định danh duy nhất, tên công cụ và chuỗi tham số JSON.",

            "Bộ điều phối phía máy chủ giải mã chuỗi này, kiểm chứng đầu vào theo "
            "lược đồ Zod tương ứng, thực thi công cụ, sau đó đưa kết quả trở lại "
            "mô hình dưới dạng thông điệp có vai trò tool kèm trường tool_call_id "
            "để khớp với tool_call ban đầu. Vòng lặp lặp đi lặp lại cho đến khi "
            "mô hình không phát thêm tool_call, đồng nghĩa với việc đã có câu trả "
            "lời cuối cùng cho người dùng.",

            "Trong chế độ truyền luồng, đặc tả OpenAI quy định rằng các mảnh tham "
            "số tool_call có thể đến rời rạc theo từng đoạn. Bộ điều phối cần tích "
            "lũy các mảnh theo chỉ số rồi xử lý sau khi nhận tín hiệu finish_reason. "
            "Đồng thời, để máy chủ nhận được số liệu sử dụng mã thông báo trong "
            "chế độ truyền luồng, cần truyền cờ stream_options.include_usage có "
            "giá trị true; nếu thiếu cờ này, các nhà cung cấp tương thích OpenAI "
            "sẽ không phát ra thông báo sử dụng và mọi báo cáo chi phí sẽ trả về "
            "không.",

            "Một quan sát thực tế đáng chú ý: chế độ luồng phát hành chunk cuối "
            "cùng với trường choices rỗng và trường usage được điền. Một cài đặt "
            "ngây thơ sẽ kiểm tra choices[0] và bỏ qua chunk này, dẫn đến mất "
            "thông tin chi phí. Lớp AiService trong dự án xử lý trường hợp này "
            "bằng cách đọc chunk.usage không phụ thuộc vào choices.",
        ],
    ))

    s.children.append(Section(
        title="2.3. Kiến trúc tiêm phụ thuộc của NestJS", level=2,
        paragraphs=[
            "NestJS sử dụng mẫu thiết kế tiêm phụ thuộc kiểu Angular: mỗi lớp "
            "được khai báo bằng decorator Injectable và được giải quyết tự động "
            "qua một mô-đun gốc. Mô-đun là đơn vị tổ chức gồm các trường imports, "
            "providers, controllers và exports. Cơ chế đa nhà cung cấp với một "
            "thẻ chung cho phép thu thập tất cả các thực thể cùng chia sẻ thẻ đó "
            "vào một mảng duy nhất.",

            "Trong dự án này, thẻ TOOL được dùng để gom mười hai công cụ thành "
            "một danh sách mà ToolRegistry duyệt qua khi đăng ký. Mẫu thiết kế "
            "tương tự được áp dụng cho thẻ SLASH_COMMAND để đăng ký các lệnh hội "
            "thoại. Cơ chế này có ba ưu điểm. Thứ nhất, thêm công cụ mới chỉ cần "
            "khai báo lớp Injectable và liệt kê trong mảng providers, không cần "
            "chỉnh sửa ToolRegistry. Thứ hai, các công cụ có thể tự khai báo phụ "
            "thuộc của riêng mình thông qua hàm khởi tạo. Thứ ba, kiểu dữ liệu "
            "được đảm bảo tĩnh nhờ TypeScript, giúp tránh các lỗi đăng ký nhầm "
            "tên hoặc thiếu phương thức.",

            "Một vài chi tiết kỹ thuật cần lưu ý khi dùng NestJS với hàm sinh bất "
            "đồng bộ và TypeScript. Đầu tiên, decorator của NestJS yêu cầu siêu "
            "dữ liệu trang trí được phát ra trong quá trình biên dịch, tức là "
            "cờ emitDecoratorMetadata trong tsconfig phải bật. Thứ hai, tsx ở "
            "thời điểm dự án được phát triển không phát siêu dữ liệu này một "
            "cách đáng tin cậy, do đó dự án dùng ts-node-dev cho môi trường phát "
            "triển và tsc cho môi trường sản xuất.",
        ],
    ))

    s.children.append(Section(
        title="2.4. Luồng sự kiện máy chủ", level=2,
        paragraphs=[
            "Luồng sự kiện máy chủ là cơ chế truyền tin một chiều từ máy chủ "
            "sang khách hàng qua một kết nối HTTP duy trì lâu dài. Mỗi sự kiện "
            "có dạng văn bản với tiền tố data: và kết thúc bằng hai ký tự xuống "
            "dòng. Trên trình duyệt, đối tượng EventSource tự động phân tích các "
            "sự kiện và phát chúng dưới dạng sự kiện DOM. Khi dùng từ một công "
            "cụ dòng lệnh như curl, cần truyền cờ -N để vô hiệu hóa bộ đệm xuất "
            "chuẩn.",

            "So với WebSocket, luồng sự kiện máy chủ đơn giản hơn về phía khách "
            "hàng, không yêu cầu thư viện đặc biệt và phù hợp với các kịch bản "
            "truyền văn bản đơn hướng như phát trực tiếp đoạn trả lời từ mô "
            "hình. Nhược điểm chính là tính một chiều: nếu cần gửi tín hiệu từ "
            "khách hàng về máy chủ giữa luồng, phải dùng kênh HTTP riêng. Trong "
            "dự án này, hủy được phát hiện bằng sự kiện close của đối tượng yêu "
            "cầu Express, do đó không cần kênh ngược.",

            "Định dạng sự kiện được dự án sử dụng là JSON đặt trong phần data "
            "của khung SSE. Mỗi sự kiện có trường type xác định loại và các "
            "trường dữ liệu cụ thể. Cách này cho phép khách hàng phân biệt rõ "
            "ràng giữa text_delta, tool_start, tool_result, turn_error và done.",
        ],
        listings=[CodeListingSpec(
            caption="Một đoạn luồng sự kiện máy chủ thực tế",
            language="text",
            code=(
                "data: {\"type\":\"session_id\",\"sessionId\":\"4f93494e-...\"}\n"
                "\n"
                "data: {\"type\":\"tool_start\",\"toolName\":\"Bash\",\n"
                "  \"toolId\":\"Bash:0\",\"input\":{\"command\":\"find src -name '*.ts' | wc -l\"}}\n"
                "\n"
                "data: {\"type\":\"tool_result\",\"toolName\":\"Bash\",\n"
                "  \"toolId\":\"Bash:0\",\"content\":\"Exit code: 0\\n\\nSTDOUT:\\n      61\\n\",\n"
                "  \"isError\":false}\n"
                "\n"
                "data: {\"type\":\"text_delta\",\"text\":\"C\"}\n"
                "data: {\"type\":\"text_delta\",\"text\":\"ó\"}\n"
                "data: {\"type\":\"text_delta\",\"text\":\" 61 file .ts\"}\n"
                "\n"
                "data: {\"type\":\"done\",\"inputTokens\":4387,\"outputTokens\":336,\"turns\":2}"
            ),
        )],
    ))

    s.children.append(Section(
        title="2.5. Giới hạn cửa sổ ngữ cảnh và nén lịch sử", level=2,
        paragraphs=[
            "Mỗi mô hình ngôn ngữ đều có giới hạn về tổng số mã thông báo có thể "
            "nhận trong một yêu cầu, gọi là cửa sổ ngữ cảnh. Các mô hình hiện đại "
            "có cửa sổ ngữ cảnh từ một trăm hai mươi tám nghìn đến hai trăm "
            "nghìn mã thông báo. Khi một phiên hội thoại trở nên dài, tổng số mã "
            "thông báo của lịch sử có thể vượt quá ngưỡng an toàn, dẫn đến lỗi "
            "yêu cầu hoặc cắt cụt lịch sử ngẫu nhiên.",

            "Nén ngữ cảnh là kỹ thuật yêu cầu mô hình tóm tắt phần lịch sử cũ, "
            "sau đó thay thế phần lịch sử bị tóm tắt bằng một thông điệp tóm tắt "
            "duy nhất, giữ lại các thông điệp gần nhất nguyên dạng. Có hai cấp "
            "độ nén. Cấp độ nhẹ, gọi là microCompact, không gọi mô hình mà chỉ "
            "rút gọn các kết quả công cụ vượt quá kích thước cho phép. Cấp độ "
            "đầy đủ, gọi là compact, gửi yêu cầu tới mô hình kèm theo lời nhắc "
            "tóm tắt.",

            "Ngưỡng kích hoạt nén tự động trong dự án được đặt ở mức một trăm "
            "bảy mươi mốt nghìn mã thông báo, tính bằng cách lấy cửa sổ ngữ cảnh "
            "tiêu chuẩn hai trăm nghìn, trừ đi mười sáu nghìn dành cho phản hồi "
            "và mười ba nghìn làm vùng đệm an toàn. Khi tổng vượt ngưỡng, máy "
            "chủ chạy microCompact trước; nếu vẫn vượt, chạy compact đầy đủ.",

            "Một vấn đề thực tế quan trọng khi nén là phải đảm bảo lịch sử mới "
            "vẫn giữ cấu trúc hợp lệ. Cụ thể, không được cắt giữa một cặp "
            "assistant tool_calls và các thông điệp tool tương ứng, vì điều này "
            "khiến mô hình bối rối ở lượt tiếp theo. Dự án giải quyết bằng cách "
            "loại bỏ các thông điệp tool ở đầu phần đuôi sau khi cắt cho đến khi "
            "rơi vào một biên user hoặc assistant.",
        ],
    ))

    s.children.append(Section(
        title="2.6. Lược đồ Zod cho kiểm chứng đầu vào", level=2,
        paragraphs=[
            "Zod là thư viện kiểm chứng dữ liệu với tâm điểm là TypeScript: các "
            "lược đồ được khai báo bằng các hàm chuỗi, đồng thời sinh ra kiểu "
            "tĩnh tương ứng. Trong dự án này, mỗi công cụ định nghĩa lược đồ "
            "tham số bằng z.strictObject, đảm bảo các trường thừa bị từ chối. "
            "Lược đồ sau đó được chuyển sang JSON Schema bằng zod-to-json-schema "
            "để gửi cho mô hình. Kiểu dữ liệu Zod đồng thời được dùng tĩnh trong "
            "phương thức call, nhờ đó mã trình kiểm chứng và mã thực thi luôn "
            "đồng bộ.",

            "Một quan sát thực nghiệm cho thấy nhiều mô hình ngôn ngữ phát ra "
            "giá trị null cho các trường tùy chọn thay vì bỏ qua chúng. Lược đồ "
            "Zod với optional() từ chối null, dẫn tới vòng lặp tái thử của mô "
            "hình. Để khắc phục, lớp ToolRegistry chuẩn hóa đầu vào bằng cách "
            "loại bỏ các khóa cấp đỉnh có giá trị null trước khi kiểm chứng.",

            "Ngoài ra, Zod cung cấp các tính năng nâng cao như transform, "
            "preprocess và refine cho phép thực hiện các phép kiểm chứng phức "
            "tạp ngay tại lớp lược đồ. Ví dụ, trường timeout của công cụ Bash "
            "được kiểm chứng phải nằm trong khoảng 100 mili-giây đến 600 nghìn "
            "mili-giây bằng .min và .max kết hợp.",
        ],
    ))

    s.children.append(Section(
        title="2.7. Mô hình truyền tín hiệu hủy", level=2,
        paragraphs=[
            "AbortController là một cơ chế chuẩn của nền tảng web cho phép phía "
            "khởi xướng yêu cầu hủy một tác vụ đang chạy. AbortController có "
            "một thuộc tính signal là một AbortSignal, có thể được truyền vào "
            "các API hỗ trợ hủy như fetch, setTimeout (kiểu Node 20+), child_"
            "process và stream. Khi controller.abort() được gọi, signal phát "
            "sự kiện abort và mọi tác vụ đang sử dụng nó dừng lại.",

            "Trong môi trường Node.js, AbortSignal.any() là một tiện ích cho "
            "phép kết hợp nhiều signal thành một signal duy nhất, kích hoạt khi "
            "bất cứ signal nguồn nào kích hoạt. Tuy nhiên, hàm này chỉ có từ "
            "Node 20.3 trở lên; dự án cung cấp một bản polyfill để chạy được "
            "trên các phiên bản cũ hơn.",
        ],
    ))
    return s


# ── Chương 3: Khảo sát hiện trạng ───────────────────────────────────────────

def _ch3() -> Section:
    s = Section(title="Chương 3: Khảo sát hiện trạng", level=1)

    s.children.append(Section(
        title="3.1. Mục tiêu khảo sát", level=2,
        paragraphs=[
            "Chương này khảo sát các giải pháp tác tử AI hiện có với mục tiêu "
            "xác định vị trí mà AgentMini-Nest hướng tới và đánh đổi giữa các "
            "phương án. Khảo sát được thực hiện trên ba sản phẩm đại diện và "
            "mười tiêu chí kỹ thuật thường gặp khi triển khai một tác tử có "
            "công cụ trong môi trường nội bộ. Bảng 3.1 trình bày so sánh tóm "
            "lược; các mục tiếp theo phân tích từng phương án chi tiết hơn.",
        ],
    ))

    s.tables.append(TableSpec(
        caption="So sánh các giải pháp tác tử AI hiện có",
        headers=["Tiêu chí", "Claude Code", "LangChain/LangGraph",
                 "OpenAI Assistants", "AgentMini-Nest"],
        rows=[
            ["Mã nguồn", "Đóng (CLI thương mại)", "Mở (MIT)", "Đóng (API)", "Mở (đề tài)"],
            ["Vòng lặp tác tử", "Hàm sinh bất đồng bộ", "Đồ thị trạng thái",
             "Cài sẵn, không lộ", "Hàm sinh bất đồng bộ"],
            ["Gọi công cụ song song", "Có (theo loại công cụ)", "Có (cấu hình node)",
             "Có (giới hạn)", "Có (theo cờ concurrencySafe)"],
            ["Nén ngữ cảnh tự động", "Có (đa cấp)", "Tự cấu hình", "Có (ẩn)",
             "Có (171K mã thông báo, hai cấp)"],
            ["Lưu phiên ngoài bộ nhớ", "Có (JSONL)", "Tùy chỉnh", "Có (đám mây)",
             "Có (JSONL trên đĩa)"],
            ["Lệnh hội thoại tích hợp", "Có (rất nhiều)", "Không sẵn", "Không sẵn",
             "Có (8 lệnh)"],
            ["Hủy đầu cuối", "Có", "Tùy node", "Có", "Có"],
            ["Giao thức MCP", "Có", "Đang phát triển", "Đang phát triển",
             "Chưa hỗ trợ"],
            ["Phụ thuộc bên ngoài", "Một tệp đóng gói", "Rất lớn", "Đám mây OpenAI",
             "Khoảng mười gói NPM"],
            ["Khả năng can thiệp lõi", "Không", "Cao (mã mở)", "Không", "Cao"],
        ],
        column_widths_cm=[3.4, 2.8, 3.0, 2.8, 3.0],
    ))

    s.children.append(Section(
        title="3.2. Claude Code", level=2,
        paragraphs=[
            "Claude Code là công cụ dòng lệnh thương mại do Anthropic phát "
            "triển, ra mắt năm 2024 và liên tục được cập nhật. Mã nguồn được "
            "biên dịch và đóng gói thành một tệp duy nhất, do đó người dùng "
            "không thể can thiệp trực tiếp vào lõi nhưng có thể nghiên cứu "
            "thông qua phiên bản đã giải khử nhiễu. Claude Code triển khai "
            "vòng lặp tác tử bằng hàm sinh bất đồng bộ trong tệp query.ts, hỗ "
            "trợ nén tự động đa cấp, đăng ký công cụ qua hàm buildTool, và "
            "lưu phiên dưới dạng JSONL trong thư mục cấu hình của người dùng.",

            "Mỗi công cụ trong Claude Code khai báo một số trường siêu dữ liệu "
            "phong phú gồm searchHint, userFacingName, isReadOnly, "
            "isConcurrencySafe, maxResultSizeChars, getActivityDescription và "
            "toAutoClassifierInput; các trường này được lớp đăng ký công cụ và "
            "trình hiển thị tận dụng để tổ chức luồng dữ liệu thông minh. "
            "Claude Code cũng hỗ trợ một hệ thống skill phong phú cho phép "
            "kích hoạt theo từng kịch bản như sửa lỗi, viết tài liệu hay xem "
            "lại mã.",

            "Cách thiết kế của Claude Code là nguồn cảm hứng trực tiếp cho dự "
            "án này. Tuy nhiên, AgentMini-Nest cắt bớt các tính năng không "
            "cần thiết cho một sản phẩm máy chủ thuần như giao diện hiển thị "
            "trên dòng lệnh, quản lý quyền thư mục, hệ thống skill và plugin, "
            "tích hợp với editor và Git, để giữ trọng tâm vào lõi vòng lặp tác "
            "tử, công cụ, lệnh, nén và lưu trữ.",
        ],
    ))

    s.children.append(Section(
        title="3.3. LangChain và LangGraph", level=2,
        paragraphs=[
            "LangChain là thư viện phổ biến nhất hiện nay cho ứng dụng tác tử "
            "AI, hỗ trợ Python và JavaScript. Nó cung cấp các khối xây dựng "
            "trừu tượng: LLM, Prompt Template, Output Parser, Tool, Agent, "
            "Memory, Vector Store, Document Loader. LangGraph là phần mở rộng "
            "cho phép mô hình hóa vòng lặp tác tử dưới dạng đồ thị trạng thái "
            "với các nút và cạnh có điều kiện.",

            "Sức mạnh của LangChain nằm ở phạm vi rất rộng và cộng đồng lớn. "
            "Nhược điểm là số lượng phụ thuộc rất lớn (hàng chục đến hàng "
            "trăm gói NPM hoặc Python tùy chế độ), nhiều lớp trừu tượng làm "
            "lập trình viên khó tiên đoán hành vi cụ thể tại thời gian chạy, "
            "và API thay đổi nhanh giữa các phiên bản gây khó khăn cho dự án "
            "dài hạn.",

            "Đối với một dự án giáo dục, việc đặt nhiều lớp trừu tượng giữa "
            "người học và mô hình ngôn ngữ làm giảm khả năng hiểu sâu cơ chế "
            "bên trong. AgentMini-Nest chọn cách viết trực tiếp trên SDK "
            "OpenAI và áp dụng tiêm phụ thuộc của NestJS để thay thế cho bộ "
            "trừu tượng riêng của LangChain. Bộ mã kết quả gọn hơn và dễ điều "
            "chỉnh hơn cho các tình huống nội bộ.",
        ],
    ))

    s.children.append(Section(
        title="3.4. OpenAI Assistants", level=2,
        paragraphs=[
            "OpenAI Assistants là nền tảng đám mây trong đó toàn bộ trạng thái "
            "hội thoại, công cụ và cơ chế nén được quản lý phía máy chủ của "
            "OpenAI. Người dùng chỉ tương tác qua API, không có quyền truy cập "
            "sâu vào lõi. Mô hình ngôn ngữ chạy trên hạ tầng OpenAI; người "
            "dùng không cần lo về cửa sổ ngữ cảnh, nén lịch sử hay lưu trữ "
            "phiên — OpenAI tự xử lý.",

            "Phương án này tiện cho ứng dụng cuối nhưng không phù hợp cho mục "
            "tiêu nghiên cứu kiến trúc, vì người học không thể quan sát các "
            "quyết định bên trong vòng lặp tác tử. Một hạn chế thực tiễn nữa "
            "là toàn bộ lịch sử nằm trên hạ tầng của nhà cung cấp, gây khó "
            "khăn cho các tổ chức có yêu cầu lưu trữ dữ liệu trong nước hoặc "
            "chính sách bảo mật chặt. Bộ công cụ cũng bị giới hạn: chỉ một số "
            "công cụ định sẵn của OpenAI và việc thêm công cụ tùy biến đòi "
            "hỏi gọi vòng lại qua webhook.",
        ],
    ))

    s.children.append(Section(
        title="3.5. Đánh giá tổng hợp và định vị", level=2,
        paragraphs=[
            "Bảng 3.1 so sánh bốn phương án theo mười tiêu chí. AgentMini-Nest "
            "hướng tới vị trí đơn giản hơn LangChain, mở hơn Claude Code và "
            "linh hoạt hơn OpenAI Assistants. Đánh đổi là phạm vi tính năng "
            "nhỏ hơn và chưa hỗ trợ giao thức MCP, các điểm được nêu lại "
            "trong chương kết luận như hạng mục ưu tiên cho giai đoạn tiếp "
            "theo.",

            "Về mặt mã nguồn, AgentMini-Nest gồm khoảng ba nghìn dòng "
            "TypeScript, so với hàng vạn dòng của LangChain hoặc hàng chục "
            "vạn của Claude Code đã giải khử nhiễu. Quy mô này vừa đủ cho một "
            "đề tài tốt nghiệp đại học, đủ để minh họa các thành phần cốt "
            "lõi và đồng thời dễ đọc trong một học phần.",
        ],
    ))
    return s


# ── Chương 4: Phân tích yêu cầu ─────────────────────────────────────────────

def _ch4() -> Section:
    s = Section(title="Chương 4: Phân tích yêu cầu", level=1)

    s.figures.append(FigureSpec(
        caption="Sơ đồ ngữ cảnh hệ thống, biên hệ thống và các tác nhân ngoài",
        image_path=FIG_DIR / "fig-context.png",
    ))

    s.children.append(Section(
        title="4.1. Tác nhân", level=2,
        paragraphs=[
            "Hệ thống có hai tác nhân chính. Tác nhân thứ nhất là người dùng "
            "cuối, thông thường gửi yêu cầu qua trình duyệt, công cụ dòng "
            "lệnh hoặc tập lệnh tự động. Người dùng không cần biết các chi "
            "tiết bên trong; họ tương tác qua một điểm cuối HTTP duy nhất gửi "
            "tin nhắn dạng văn bản và nhận lại luồng sự kiện máy chủ.",

            "Tác nhân thứ hai là mô hình ngôn ngữ phía nhà cung cấp; đây là "
            "tác nhân phía máy nhưng đóng vai trò như một thực thể chủ động "
            "vì nó quyết định khi nào gọi công cụ và khi nào kết thúc lượt. "
            "Hai tác nhân tương tác gián tiếp qua máy chủ, không bao giờ trao "
            "đổi trực tiếp.",

            "Ngoài hai tác nhân chính, hệ thống còn tương tác với một số tác "
            "nhân phụ: dịch vụ tìm kiếm web (Brave hoặc DuckDuckGo) qua công "
            "cụ WebSearch, các trang web bất kỳ qua công cụ WebFetch, hệ "
            "thống tệp cục bộ qua các công cụ tệp, và vỏ lệnh hệ điều hành "
            "qua công cụ Bash. Hình 4.1 minh họa ngữ cảnh hệ thống.",
        ],
    ))

    s.tables.append(TableSpec(
        caption="Yêu cầu chức năng của hệ thống",
        headers=["Mã", "Tên yêu cầu", "Mô tả ngắn gọn"],
        rows=[
            ["FR-01", "Gửi tin nhắn người dùng",
             "Khách hàng gửi POST /api/chat với nội dung tin nhắn; máy chủ phản hồi luồng SSE."],
            ["FR-02", "Quản lý phiên hội thoại",
             "Hệ thống nhận diện hoặc tạo phiên qua sessionId, tiêu đề X-Session-Id hoặc bản đồ phiên theo khách hàng."],
            ["FR-03", "Gọi công cụ",
             "Mô hình có thể yêu cầu thực thi một trong mười hai công cụ; máy chủ giải mã, kiểm chứng và trả kết quả."],
            ["FR-04", "Chạy công cụ song song",
             "Các công cụ chỉ đọc được phép chạy đồng thời trong cùng một lượt khi mô hình yêu cầu nhiều công cụ."],
            ["FR-05", "Hủy yêu cầu",
             "Khi khách hàng đóng kết nối, các công cụ đang chạy phải được dừng lại và tài nguyên được giải phóng."],
            ["FR-06", "Nén ngữ cảnh tự động",
             "Khi tổng mã thông báo vượt 171.000, hệ thống tự động tóm tắt lịch sử trước khi gọi mô hình lượt tiếp theo."],
            ["FR-07", "Nén ngữ cảnh thủ công",
             "Người dùng có thể chủ động nén lịch sử bằng lệnh /compact với tùy chọn truyền chỉ dẫn riêng."],
            ["FR-08", "Lưu phiên trên đĩa",
             "Mỗi tin nhắn được ghi vào tệp JSONL theo phiên, kèm tệp siêu dữ liệu thống kê."],
            ["FR-09", "Khôi phục phiên",
             "Khi máy chủ khởi động lại, phiên có thể được tải lại từ đĩa khi khách hàng cung cấp sessionId."],
            ["FR-10", "Lệnh hội thoại",
             "Tin nhắn bắt đầu bằng dấu gạch chéo được định tuyến đến hệ thống lệnh thay vì gửi đến mô hình."],
            ["FR-11", "Theo dõi sử dụng",
             "Hệ thống tích lũy tổng mã thông báo đầu vào và đầu ra cho từng phiên, có thể truy vấn qua /cost."],
            ["FR-12", "Phát hiện vòng lặp công cụ",
             "Khi cùng một lời gọi công cụ với cùng tham số và cùng kết quả lặp lại quá ba lượt, hệ thống nhắc mô hình thay đổi cách tiếp cận và dừng nếu lặp tiếp."],
            ["FR-13", "Tham chiếu nhanh siêu dữ liệu",
             "Khách hàng có thể truy vấn danh sách công cụ, lệnh và phiên qua các điểm cuối tóm tắt."],
            ["FR-14", "Xuất bản hội thoại",
             "Lệnh /export trả về toàn bộ lịch sử dưới dạng JSON để lưu trữ ngoài."],
        ],
        column_widths_cm=[1.6, 4.0, 9.5],
    ))

    s.tables.append(TableSpec(
        caption="Yêu cầu phi chức năng của hệ thống",
        headers=["Mã", "Hạng mục", "Tiêu chí cụ thể"],
        rows=[
            ["NFR-01", "Hiệu năng",
             "Độ trễ truyền đoạn văn bản đầu tiên dưới một giây trong điều kiện mạng thông thường."],
            ["NFR-02", "Khả năng chịu lỗi mô hình",
             "Lỗi tạm thời của mô hình được tự thử lại tối đa hai lần với độ trễ tăng dần (500 ms, 1 s)."],
            ["NFR-03", "Khả năng chịu lỗi công cụ",
             "Mọi ngoại lệ trong công cụ đều được chuyển thành thông điệp tool có cờ isError=true; vòng lặp không bị phá vỡ."],
            ["NFR-04", "An toàn tệp",
             "Mọi thao tác tệp đều bị giới hạn trong WORKSPACE_ROOT thông qua hàm resolveSafePath."],
            ["NFR-05", "Khả năng quan sát",
             "Mỗi sự kiện luồng được phát qua giao diện thống nhất; nhật ký NestJS in cấu trúc theo cấp."],
            ["NFR-06", "Khả năng mở rộng",
             "Thêm công cụ mới chỉ cần đăng ký một lớp dịch vụ, không sửa lõi."],
            ["NFR-07", "Tính nhất quán",
             "Đệm ghi đĩa được rút trước khi tệp JSONL bị viết lại sau nén; không có khoảng thời gian giữa cũ và mới."],
            ["NFR-08", "Giới hạn kích thước",
             "Đầu ra mỗi công cụ bị giới hạn ở mức 100.000 ký tự để tránh tràn ngữ cảnh."],
            ["NFR-09", "An toàn đường dẫn",
             "Tham số đầu vào của các công cụ tệp được kiểm chứng bằng Zod và chuẩn hóa loại bỏ giá trị null."],
            ["NFR-10", "Khả năng kiểm thử",
             "Mỗi mô-đun có thể được khởi tạo độc lập và thay thế bằng phiên bản giả lập."],
            ["NFR-11", "Tính tương thích",
             "Hệ thống chạy trên Node 18 trở lên; phụ thuộc native được tránh để dễ triển khai."],
        ],
        column_widths_cm=[1.6, 3.5, 10.0],
    ))

    s.children.append(Section(
        title="4.2. Trường hợp sử dụng tiêu biểu", level=2,
        paragraphs=[
            "Sau đây là các trường hợp sử dụng đại diện. Mỗi trường hợp được "
            "mô tả vắn tắt theo định dạng tác nhân, tiền điều kiện, luồng cơ "
            "bản và kết quả. Bảng 4.3 liệt kê các trường hợp; chương 5 mô tả "
            "chi tiết hơn ở dạng sơ đồ trình tự cho hai trường hợp đại diện. "
            "Hình 4.2 trình bày sơ đồ trường hợp sử dụng theo phong cách UML.",
        ],
    ))

    s.figures.append(FigureSpec(
        caption="Sơ đồ trường hợp sử dụng theo phong cách UML",
        image_path=FIG_DIR / "fig-usecase.png",
    ))

    s.tables.append(TableSpec(
        caption="Các trường hợp sử dụng tiêu biểu",
        headers=["Mã", "Tên", "Tiền điều kiện", "Luồng cơ bản"],
        rows=[
            ["UC-01", "Hỏi đáp đơn",
             "Người dùng đã có máy chủ chạy.",
             "Người dùng gửi câu hỏi; mô hình phản hồi văn bản; máy chủ trả luồng SSE; sự kiện done có usage."],
            ["UC-02", "Đếm tệp trong thư mục",
             "Có thư mục mã nguồn.",
             "Người dùng yêu cầu đếm; mô hình gọi Bash; nhận kết quả; trả lời số lượng."],
            ["UC-03", "Tạo và sửa tệp Excel",
             "Có Python và thư viện openpyxl.",
             "Người dùng yêu cầu tạo; mô hình ghi tập lệnh và chạy qua Bash; sau đó tiếp tục lượt khác để sửa."],
            ["UC-04", "Tìm kiếm thông tin trên mạng",
             "Khóa Brave hoặc DuckDuckGo khả dụng.",
             "Người dùng đặt câu hỏi cập nhật; mô hình gọi WebSearch; tóm tắt và trích nguồn."],
            ["UC-05", "Khôi phục phiên cũ",
             "Phiên đã được lưu trên đĩa.",
             "Người dùng gửi tin nhắn không kèm sessionId; máy chủ tự khớp phiên gần nhất theo khách hàng."],
            ["UC-06", "Nén ngữ cảnh thủ công",
             "Phiên đang dài.",
             "Người dùng gõ lệnh /compact; mô hình tóm tắt; lịch sử trên đĩa được ghi lại."],
            ["UC-07", "Xuất bản hội thoại",
             "Phiên có lịch sử đáng kể.",
             "Người dùng gõ /export; máy chủ trả về lịch sử dạng JSON qua sự kiện text_delta."],
            ["UC-08", "Quản lý danh sách công việc",
             "Mô hình đang triển khai một tác vụ phức tạp.",
             "Mô hình gọi TodoWrite để tạo danh sách; cập nhật trạng thái khi tiến bộ."],
            ["UC-09", "Quan sát chi phí",
             "Phiên có ít nhất một lượt hoàn tất.",
             "Người dùng gõ /cost; máy chủ hiển thị tổng mã thông báo và tỉ lệ ngữ cảnh."],
        ],
        column_widths_cm=[1.4, 3.4, 4.0, 6.2],
    ))
    return s


# ── Chương 5: Thiết kế hệ thống ─────────────────────────────────────────────

def _ch5() -> Section:
    s = Section(title="Chương 5: Thiết kế hệ thống", level=1)

    s.children.append(Section(
        title="5.1. Tổng quan kiến trúc", level=2,
        paragraphs=[
            "Hình 5.1 trình bày kiến trúc tổng thể của hệ thống dưới dạng một "
            "sơ đồ thành phần với ba lớp ngang. Lớp giao diện gồm các thành "
            "phần tiếp xúc trực tiếp với khách hàng HTTP. Lớp điều phối gồm "
            "các dịch vụ thực hiện công việc chính của tác tử. Lớp lưu trữ và "
            "bên ngoài gồm các thành phần cung cấp tài nguyên cho lớp điều "
            "phối.",

            "Các phụ thuộc chỉ đi theo một chiều từ lớp giao diện xuống lớp "
            "điều phối, rồi từ lớp điều phối xuống lớp lưu trữ. Quy ước này "
            "tránh chu trình phụ thuộc và làm cho hệ thống dễ kiểm thử ở "
            "từng tầng riêng. Khi cần phá vỡ quy ước (ví dụ ResumeCommand "
            "cần truy cập SessionService nhưng SessionService thuộc tầng "
            "điều phối), NestJS cung cấp cơ chế forwardRef để giải quyết "
            "phụ thuộc tròn ở thời gian khởi tạo.",

            "Mỗi mô-đun NestJS phụ trách một lớp chức năng riêng biệt. AppModule "
            "là mô-đun gốc tổng hợp; AppConfigModule cung cấp cấu hình toàn "
            "cục đã được kiểm chứng; AiModule chứa lớp truyền luồng tới mô "
            "hình ngôn ngữ; ToolsModule chứa toàn bộ công cụ và ToolRegistry; "
            "CompactionModule chứa CompactionService; StorageModule chứa "
            "SessionStore; CommandsModule chứa CommandRegistry và các lệnh; "
            "EngineModule kết hợp các dịch vụ thành QueryService và "
            "SessionService; ChatModule chứa ChatController và "
            "ClientSessionMap.",
        ],
    ))

    s.figures.append(FigureSpec(
        caption="Kiến trúc phân lớp của AgentMini-Nest với các thành phần thuộc từng lớp",
        image_path=FIG_DIR / "fig-architecture.png",
    ))

    s.children.append(Section(
        title="5.2. Mô hình lớp của công cụ", level=2,
        paragraphs=[
            "Hình 5.2 trình bày sơ đồ lớp của hệ thống công cụ ở dạng UML. "
            "Giao diện Tool định nghĩa một hợp đồng tối thiểu mà mọi công cụ "
            "phải tuân thủ. Các trường siêu dữ liệu readOnly, concurrencySafe, "
            "timeoutMs và maxResultSizeChars cho phép ToolRegistry quyết định "
            "cách thực thi công cụ mà không cần biết chi tiết bên trong. "
            "Phương thức call nhận vào tham số đầu vào đã được kiểm chứng và "
            "một ngữ cảnh chứa tín hiệu hủy.",

            "Mỗi công cụ là một lớp Injectable cài đặt giao diện này. Các "
            "trường phụ thuộc của công cụ (ví dụ AppConfig, TodoStore) được "
            "nhận qua hàm khởi tạo và được tiêm tự động bởi NestJS. Cách tách "
            "giữa giao diện và cài đặt cho phép thay thế công cụ trong kiểm "
            "thử bằng các phiên bản giả lập một cách thuận lợi.",

            "Một quyết định thiết kế đáng chú ý: ToolRegistry không trực tiếp "
            "thực hiện gọi tool.call mà bọc nó trong Promise.race với một "
            "tín hiệu hủy kết hợp. Cách này cho phép áp dụng đồng nhất thời "
            "gian chờ và tín hiệu hủy mà không yêu cầu mỗi công cụ tự cài "
            "đặt logic này.",
        ],
    ))

    s.figures.append(FigureSpec(
        caption="Sơ đồ lớp của giao diện Tool, các công cụ cụ thể và ToolRegistry",
        image_path=FIG_DIR / "fig-class.png",
    ))

    s.children.append(Section(
        title="5.3. Mô hình dữ liệu", level=2,
        paragraphs=[
            "Hình 5.3 trình bày mô hình dữ liệu chính trong bộ nhớ và trên "
            "đĩa. Phiên là thực thể trung tâm, chứa danh sách thông điệp "
            "APIMessage, thống kê tích lũy và các trường thời gian. Mỗi "
            "thông điệp APIMessage có thể chứa một danh sách ToolCall nếu vai "
            "trò là assistant và một trường tool_call_id nếu vai trò là tool. "
            "Trên đĩa, mỗi phiên được lưu thành một tệp JSONL với ba loại "
            "dòng (header, message, compact) và một tệp meta.json riêng.",

            "Mô hình dữ liệu được thiết kế đơn giản đến mức tối đa: không có "
            "khóa ngoại, không có chỉ mục, không có quan hệ phức tạp. Đây là "
            "lựa chọn có chủ đích vì kích thước dữ liệu nhỏ và truy vấn duy "
            "nhất là theo phiên. Khi cần mở rộng quy mô, lớp lưu trữ có thể "
            "được thay bằng Redis (giữ cấu trúc tương tự) hoặc PostgreSQL "
            "(với bảng riêng cho phiên và thông điệp).",
        ],
    ))

    s.figures.append(FigureSpec(
        caption="Mô hình dữ liệu chính trong bộ nhớ và trên đĩa",
        image_path=FIG_DIR / "fig-data-model.png",
    ))

    s.children.append(Section(
        title="5.4. Vòng lặp tác tử", level=2,
        paragraphs=[
            "Vòng lặp tác tử được thực hiện trong lớp QueryService dưới dạng "
            "một hàm sinh bất đồng bộ. Mỗi lần lặp tương ứng với một lượt gọi "
            "mô hình. Các bước trong một lượt gồm: kiểm tra ngưỡng nén ngữ "
            "cảnh, gọi mô hình, nhận luồng phản hồi, tách văn bản và lời gọi "
            "công cụ, thực thi công cụ (song song hoặc tuần tự), ghi kết quả "
            "vào lịch sử, sau đó quay lại đầu vòng lặp. Vòng lặp dừng khi mô "
            "hình không phát thêm tool_call hoặc khi đạt giới hạn maxTurns.",

            "Hình 5.4 mô tả chuỗi tương tác giữa các thành phần trong một "
            "lượt dưới dạng sơ đồ trình tự UML. Các đường nét đứt biểu diễn "
            "các thông điệp phản hồi. Các thanh kích hoạt trên mỗi đường đời "
            "cho thấy khoảng thời gian thành phần đang xử lý.",

            "Một quyết định kỹ thuật quan trọng là cách chia lời gọi công cụ "
            "thành nhóm song song và nhóm tuần tự. Các công cụ chỉ đọc "
            "(readOnly bằng true) mặc định được phép chạy song song; các "
            "công cụ có ghi (như Edit, Write, Bash) chạy tuần tự để tránh "
            "tương tác không mong muốn giữa các thao tác viết. Sau khi tất "
            "cả công cụ hoàn thành, kết quả được gộp lại theo thứ tự mô hình "
            "đã phát ra trong tool_calls để giữ nguyên trật tự lịch sử.",
        ],
    ))

    s.figures.append(FigureSpec(
        caption="Sơ đồ trình tự xử lý một lượt từ tin nhắn người dùng đến phản hồi cuối",
        image_path=FIG_DIR / "fig-sequence.png",
    ))

    s.children.append(Section(
        title="5.5. Sơ đồ trạng thái của một yêu cầu", level=2,
        paragraphs=[
            "Hình 5.5 mô hình hóa các trạng thái mà một yêu cầu chat đi qua "
            "từ lúc nhận tới lúc kết thúc. Trạng thái Pre-turn check quyết "
            "định có nén ngữ cảnh trước khi gọi mô hình hay không. Trạng "
            "thái Streaming tích lũy các mảnh văn bản và lời gọi công cụ; "
            "nó tự lặp với mỗi delta nhận được. Trạng thái Tool execution "
            "xử lý các lời gọi công cụ; sau khi xong, vòng lặp quay lại "
            "trạng thái Pre-turn. Trạng thái Aborted được kích hoạt khi "
            "tín hiệu hủy đầu cuối được phát.",

            "Trạng thái Done là trạng thái kết thúc thông thường khi mô "
            "hình không phát thêm tool_call. Sự kiện done được phát ra với "
            "thống kê inputTokens, outputTokens và số lượt. Luồng SSE được "
            "đóng sau sự kiện này.",
        ],
    ))

    s.figures.append(FigureSpec(
        caption="Sơ đồ trạng thái của một yêu cầu chat trong vòng lặp tác tử",
        image_path=FIG_DIR / "fig-state.png",
    ))

    s.children.append(Section(
        title="5.6. Pipeline xử lý một lời gọi công cụ", level=2,
        paragraphs=[
            "Hình 5.6 trình bày pipeline xử lý một lời gọi công cụ trong "
            "ToolRegistry. Pipeline có ba pha. Pha tiền xử lý gồm chuẩn hóa "
            "đầu vào (loại bỏ giá trị null cho các trường tùy chọn) và kiểm "
            "chứng bằng Zod. Pha thực thi gồm kết hợp tín hiệu hủy của khách "
            "hàng với tín hiệu thời gian chờ của công cụ thông qua "
            "AbortSignal.any (có polyfill cho Node cũ), sau đó gọi tool.call "
            "với ngữ cảnh chứa tín hiệu kết hợp. Pha hậu xử lý áp dụng giới "
            "hạn kích thước kết quả trước khi đẩy thông điệp vào lịch sử.",

            "Bộ chống lặp công cụ là một thành phần ngang ở vòng lặp tác tử, "
            "kiểm tra dấu vân tay (tên, tham số, một phần kết quả) sau mỗi "
            "lượt; khi lặp lại quá ba lần liên tiếp, một thông điệp nhắc nhở "
            "được chèn vào lịch sử để khuyến khích mô hình đổi cách tiếp "
            "cận. Nếu lặp tiếp tới lượt thứ tư, hệ thống phát một sự kiện "
            "turn_error và thoát vòng lặp.",

            "Một tình huống thường gặp với các mô hình tương thích OpenAI là "
            "trường tham số tùy chọn được gửi với giá trị JSON null thay vì "
            "bị bỏ qua. Lược đồ Zod với optional() từ chối null, nên nếu "
            "không xử lý, mô hình sẽ lặp lại lời gọi tới cùng. Hàm "
            "stripTopLevelNulls duyệt qua đối tượng tham số ở mức đỉnh và "
            "loại bỏ các khóa có giá trị null trước khi kiểm chứng.",
        ],
    ))

    s.figures.append(FigureSpec(
        caption="Pipeline xử lý một lời gọi công cụ trong ToolRegistry",
        image_path=FIG_DIR / "fig-tool-pipeline.png",
    ))

    s.children.append(Section(
        title="5.7. Cơ chế nén ngữ cảnh", level=2,
        paragraphs=[
            "Hình 5.7 trình bày cây quyết định nén ngữ cảnh. Tại đầu mỗi "
            "lượt, QueryService gọi CompactionService.shouldAutoCompact để "
            "kiểm tra ngưỡng. Nếu vượt, microCompact được chạy trước. "
            "microCompact duyệt lịch sử và rút gọn các thông điệp tool có "
            "nội dung vượt tám nghìn ký tự bằng cách thay phần thừa bằng "
            "ghi chú cắt cụt. Bước này không tốn lượt mô hình và thường "
            "giảm hai phần ba số mã thông báo trong trường hợp nguyên nhân "
            "là kết quả Bash hoặc WebFetch lớn.",

            "Nếu microCompact không đủ, máy chủ thực hiện compact đầy đủ. "
            "Nó thêm một thông điệp người dùng chứa lời nhắc tóm tắt vào "
            "cuối lịch sử, gửi toàn bộ tới mô hình mà không kèm danh sách "
            "công cụ (để mô hình bị buộc trả lời bằng văn bản). Phản hồi "
            "được phân tích để lấy phần bên trong cặp thẻ summary; phần "
            "phân tích trung gian bên trong cặp thẻ analysis bị loại bỏ. "
            "Lịch sử cũ được thay bằng dãy: thông điệp hệ thống nguyên gốc, "
            "một thông điệp người dùng đặc biệt với tiền tố compact-boundary "
            "chứa tóm tắt, và bốn thông điệp gần nhất nguyên dạng.",

            "Khi compact thất bại (ví dụ mô hình trả về phản hồi rỗng hoặc "
            "lỗi mạng), bộ đếm thất bại liên tiếp được tăng. Sau ba lần "
            "thất bại liên tiếp, cơ chế ngắt mạch dừng các nỗ lực compact "
            "tiếp theo trong phiên hiện tại để tránh hao phí tài nguyên. "
            "Cơ chế này được lấy cảm hứng từ thực tế của Claude Code, nơi "
            "các phiên có ngữ cảnh không thể nén được tiếp tục lãng phí "
            "tài nguyên trong suốt nhiều giờ.",
        ],
    ))

    s.figures.append(FigureSpec(
        caption="Cây quyết định nén ngữ cảnh tự động và thủ công",
        image_path=FIG_DIR / "fig-compaction.png",
    ))

    s.children.append(Section(
        title="5.8. Lưu trữ phiên", level=2,
        paragraphs=[
            "Lớp lưu trữ phiên sử dụng một tệp JSONL cho mỗi phiên kèm một "
            "tệp siêu dữ liệu .meta.json. Tệp JSONL chứa các dòng ở ba dạng: "
            "dòng tiêu đề chứa định danh phiên và phiên bản định dạng, dòng "
            "thông điệp chứa toàn bộ thông điệp APIMessage cùng dấu thời "
            "gian ghi, và dòng đánh dấu nén ghi lại sự kiện compact với "
            "thống kê.",

            "Việc ghi được làm trễ thông qua hàng đợi nội bộ với thời gian "
            "xả là một trăm mili-giây, gom theo từng tệp để giảm chi phí "
            "ghi đĩa. Khi nén được thực hiện, hàng đợi được rút hết trước "
            "khi tệp được ghi lại để bảo đảm không có khoảng thời gian giữa "
            "trạng thái cũ và mới. Hình 5.8 minh họa bố cục.",

            "Việc khôi phục phiên diễn ra theo ba bước: "
            "SessionService.getOrCreate trước hết kiểm tra bộ nhớ đệm Map; "
            "nếu không thấy, kiểm tra sự tồn tại của tệp trên đĩa; nếu có, "
            "đọc, chuyển sang đối tượng phiên trong bộ nhớ; nếu không có, "
            "tạo phiên mới. Cách này cho phép máy chủ khởi động lại mà "
            "không mất dữ liệu, đồng thời giữ chi phí truy cập thấp cho các "
            "phiên đang hoạt động.",

            "JSONL được chọn vì ba lý do. Thứ nhất, nó cho phép ghi theo "
            "kiểu thêm nối thuần túy, tránh các thao tác ghi-đè-toàn-tệp "
            "tốn kém. Thứ hai, mỗi dòng là một bản ghi độc lập có thể được "
            "phân tích mà không cần đọc toàn bộ tệp; do đó việc đọc dòng "
            "đầu tiên đủ để biết thông tin phiên bản. Thứ ba, nó là định "
            "dạng tự mô tả, lập trình viên có thể đọc bằng mắt thường khi "
            "gỡ lỗi.",
        ],
    ))

    s.figures.append(FigureSpec(
        caption="Bố cục tệp JSONL và quy trình ghi đĩa được trễ",
        image_path=FIG_DIR / "fig-persistence.png",
    ))

    s.children.append(Section(
        title="5.9. Cơ chế hủy đầu cuối", level=2,
        paragraphs=[
            "Khi khách hàng đóng kết nối, sự kiện close của đối tượng yêu "
            "cầu Express kích hoạt một AbortController do bộ điều khiển sở "
            "hữu. Tín hiệu hủy được truyền vào QueryService rồi đến từng "
            "lời gọi công cụ thông qua ToolCallContext. Các công cụ tiêu "
            "thụ thời gian phản ứng với tín hiệu này:",
        ],
        bullets=[[
            "Bash gửi SIGTERM cho tiến trình con và chờ thoát; nếu tiến "
            "trình không thoát trong thời gian cho phép, mô-đun child_process "
            "tự dùng SIGKILL.",
            "WebFetch dừng yêu cầu HTTP đang chờ thông qua AbortSignal "
            "được truyền vào tham số fetch của Node.",
            "WebSearch hủy lời gọi nhà cung cấp tìm kiếm tương tự, đồng "
            "thời chỉ cần một lần thử lại trước khi báo lỗi.",
            "Sleep giải quyết tức thì lời hứa của nó, không chờ hết khoảng "
            "thời gian yêu cầu.",
        ]],
    ))

    s.children.append(Section(
        title="5.10. Bản đồ phiên theo khách hàng", level=2,
        paragraphs=[
            "ClientSessionMap là một thành phần nhỏ nhưng quan trọng về mặt "
            "trải nghiệm. Nó nhớ phiên gần nhất theo từng khách hàng để tự "
            "động duy trì mạch hội thoại khi khách hàng không truyền "
            "sessionId. Định danh khách hàng được xác định theo thứ tự ưu "
            "tiên: tiêu đề X-Client-Id (nếu khách hàng tự khai báo), kết "
            "hợp X-Forwarded-For với User-Agent (sau bộ định tuyến), kết "
            "hợp địa chỉ IP với User-Agent (mặc định), hoặc giá trị default "
            "(chế độ phát triển một người dùng).",

            "Bản đồ chỉ tồn tại trong bộ nhớ; phiên trên đĩa là nguồn dữ "
            "liệu chính. Do đó, sau khi máy chủ khởi động lại, khách hàng "
            "vẫn cần truyền sessionId một lần để khôi phục, sau đó các yêu "
            "cầu tiếp theo lại tự nhớ. Đối với các môi trường nhiều người "
            "dùng có yêu cầu cách ly cao, tiêu đề X-Client-Id là cách an "
            "toàn nhất.",
        ],
    ))
    return s


# ── Chương 6: Triển khai ────────────────────────────────────────────────────

def _ch6() -> Section:
    s = Section(title="Chương 6: Triển khai chi tiết", level=1)

    s.tables.append(TableSpec(
        caption="Ngăn xếp công nghệ sử dụng trong dự án",
        headers=["Lớp", "Công nghệ", "Mục đích"],
        rows=[
            ["Ngôn ngữ", "TypeScript 5", "Kiểu tĩnh, hỗ trợ trình biên tập tốt"],
            ["Khung máy chủ", "NestJS 10 trên Express",
             "Cấu trúc mô-đun, tiêm phụ thuộc, bộ điều khiển HTTP"],
            ["Mô hình ngôn ngữ", "OpenAI SDK với điểm cuối tùy biến",
             "Tương thích với mọi nhà cung cấp tuân theo lược đồ OpenAI"],
            ["Kiểm chứng", "Zod 3", "Lược đồ tham số công cụ và biến môi trường"],
            ["Tìm kiếm tệp", "fast-glob", "Khớp mẫu tệp tin tốc độ cao"],
            ["Tìm kiếm nội dung", "ripgrep (tự rơi về grep)",
             "Tìm theo biểu thức chính quy với nhiều cờ tinh chỉnh"],
            ["Lưu trữ", "Tệp JSONL trên đĩa",
             "Đơn giản, có khả năng kiểm tra bằng mắt thường"],
            ["Phát triển", "ts-node-dev", "Khởi động lại nóng giữ siêu dữ liệu trang trí"],
            ["Chuyển lược đồ", "zod-to-json-schema",
             "Chuyển lược đồ Zod sang JSON Schema cho mô hình"],
            ["Runtime Node", "Node.js 18+", "Hỗ trợ fetch và AbortSignal toàn cục"],
        ],
        column_widths_cm=[3.5, 5.0, 7.0],
    ))

    s.children.append(Section(
        title="6.1. Tổ chức mã nguồn", level=2,
        paragraphs=[
            "Mã nguồn được tổ chức theo từng lớp chức năng. Thư mục common "
            "chứa các kiểu dữ liệu chung như APIMessage, ToolCall, SSEEvent "
            "và các tiện ích nhỏ như ước lượng mã thông báo. Thư mục config "
            "chứa cấu hình môi trường được kiểm chứng bằng Zod và xuất ra "
            "như một nhà cung cấp toàn cục. Thư mục ai chứa lớp truyền "
            "luồng tới mô hình ngôn ngữ.",

            "Thư mục tools chứa từng công cụ trong một thư mục con riêng, "
            "mỗi thư mục có tệp lời nhắc và tệp triển khai. Cấu trúc này "
            "phản chiếu thiết kế của Claude Code và giúp dễ dàng định vị "
            "tệp khi cần sửa đổi. Thư mục services chứa các dịch vụ ngang "
            "gồm nén ngữ cảnh, lệnh hội thoại và lưu trữ. Thư mục engine "
            "chứa vòng lặp tác tử và quản lý phiên. Thư mục chat chứa bộ "
            "điều khiển HTTP và bản đồ phiên theo khách hàng. Thư mục bin "
            "chứa công cụ dòng lệnh viết bằng Node nguyên gốc, không phụ "
            "thuộc TypeScript.",
        ],
    ))

    s.children.append(Section(
        title="6.2. Đăng ký công cụ", level=2,
        paragraphs=[
            "Mỗi công cụ là một lớp Injectable cài đặt giao diện Tool. Lớp "
            "được khai báo trong tệp riêng cùng với lược đồ Zod và lời nhắc. "
            "Trong ToolsModule, các lớp công cụ được liệt kê và cùng được "
            "cung cấp dưới thẻ TOOL bằng một useFactory thu thập tất cả các "
            "phiên bản đã giải. ToolRegistry nhận mảng này khi khởi tạo và "
            "lập chỉ mục theo tên.",
        ],
        listings=[CodeListingSpec(
            caption="Đăng ký công cụ trong ToolsModule",
            language="TypeScript",
            code=(
                "const TOOLS = [BashTool, ReadTool, WriteTool, EditTool, MultiEditTool,\n"
                "  GlobTool, GrepTool, LSTool, WebFetchTool, WebSearchTool,\n"
                "  TodoWriteTool, SleepTool];\n"
                "\n"
                "@Module({\n"
                "  providers: [\n"
                "    ToolRegistry,\n"
                "    TodoStore,\n"
                "    ...TOOLS,\n"
                "    {\n"
                "      provide: TOOL,\n"
                "      useFactory: (...tools) => tools,\n"
                "      inject: TOOLS,\n"
                "    },\n"
                "  ],\n"
                "  exports: [ToolRegistry, TodoStore],\n"
                "})\n"
                "export class ToolsModule {}"
            ),
        )],
    ))

    s.children.append(Section(
        title="6.3. Phương thức execute của ToolRegistry", level=2,
        paragraphs=[
            "Phương thức execute là điểm vào duy nhất để vòng lặp tác tử "
            "gọi một công cụ. Nó chuẩn hóa đầu vào, kiểm chứng bằng Zod, "
            "kết hợp tín hiệu hủy của khách hàng với một tín hiệu thời gian "
            "chờ riêng cho công cụ, gọi tool.call và áp dụng giới hạn kích "
            "thước kết quả. Mọi ngoại lệ đều được bắt và chuyển thành "
            "ToolResult với cờ isError=true; vòng lặp không bị phá vỡ.",
        ],
        listings=[CodeListingSpec(
            caption="Lõi của phương thức execute trong ToolRegistry",
            language="TypeScript",
            code=(
                "async execute(name, rawInput, signal) {\n"
                "  const tool = this.tools.get(name);\n"
                "  if (!tool) return err('Tool not found');\n"
                "  const cleaned = stripTopLevelNulls(rawInput);\n"
                "  const parsed = tool.schema.safeParse(cleaned ?? {});\n"
                "  if (!parsed.success) return err('Invalid input ' + ...);\n"
                "\n"
                "  const timeoutCtl = new AbortController();\n"
                "  const timeoutId = setTimeout(() => timeoutCtl.abort(),\n"
                "    tool.timeoutMs ?? DEFAULT_TIMEOUT_MS);\n"
                "  const combined = combineSignals(signal, timeoutCtl.signal);\n"
                "\n"
                "  let result;\n"
                "  try {\n"
                "    result = await Promise.race([\n"
                "      tool.call(parsed.data, { signal: combined }),\n"
                "      rejectOnAbort(combined),\n"
                "    ]);\n"
                "  } catch (e) { return err('Tool failed: ' + e.message); }\n"
                "  finally { clearTimeout(timeoutId); }\n"
                "\n"
                "  if (result.content.length > maxChars) {\n"
                "    result.content = result.content.slice(0, maxChars) +\n"
                "      '\\n... (output truncated)';\n"
                "  }\n"
                "  return result;\n"
                "}"
            ),
        )],
    ))

    s.children.append(Section(
        title="6.4. Vòng lặp tác tử và song song hóa công cụ", level=2,
        paragraphs=[
            "Vòng lặp tác tử là hàm sinh bất đồng bộ run trong QueryService. "
            "Mỗi lượt thực hiện các bước được mô tả ở mục 5.4. Phần đặc biệt "
            "đáng chú ý là cách vòng lặp tách lời gọi công cụ thành nhóm "
            "song song và nhóm tuần tự, sau đó gộp lại theo thứ tự gốc trong "
            "lịch sử.",
        ],
        listings=[CodeListingSpec(
            caption="Phân nhóm và thực thi công cụ song song trong vòng lặp tác tử",
            language="TypeScript",
            code=(
                "const safeIdx = [], unsafeIdx = [];\n"
                "for (let i = 0; i < toolCalls.length; i++) {\n"
                "  if (this.registry.isConcurrencySafe(toolCalls[i].function.name))\n"
                "    safeIdx.push(i);\n"
                "  else\n"
                "    unsafeIdx.push(i);\n"
                "}\n"
                "\n"
                "// Concurrency-safe tools run in parallel\n"
                "await Promise.all(safeIdx.map(async (i) => {\n"
                "  results[i] = await this.executeOne(toolCalls[i], signal);\n"
                "}));\n"
                "// Writes run sequentially to preserve ordering effects\n"
                "for (const i of unsafeIdx) {\n"
                "  if (signal.aborted) break;\n"
                "  results[i] = await this.executeOne(toolCalls[i], signal);\n"
                "}"
            ),
        )],
    ))

    s.children.append(Section(
        title="6.5. Định dạng phản hồi luồng sự kiện máy chủ", level=2,
        paragraphs=[
            "Bộ điều khiển ChatController phát các sự kiện ra luồng sự kiện "
            "máy chủ với các loại sự kiện được định nghĩa thống nhất trong "
            "common/types.ts. Bảng 6.2 mô tả định dạng từng loại sự kiện.",
        ],
        tables=[TableSpec(
            caption="Các loại sự kiện luồng sự kiện máy chủ và ý nghĩa",
            headers=["Loại sự kiện", "Trường dữ liệu", "Ý nghĩa"],
            rows=[
                ["session_id", "sessionId",
                 "Phát một lần ngay sau khi máy chủ xác định phiên cho yêu cầu hiện tại."],
                ["text_delta", "text",
                 "Một mảnh văn bản trả lời từ mô hình; khách hàng nối liên tiếp."],
                ["tool_start", "toolName, toolId, input",
                 "Mô hình bắt đầu một lời gọi công cụ với tham số đã được chuẩn hóa."],
                ["tool_result", "toolName, toolId, content, isError",
                 "Kết quả công cụ; cờ isError chỉ ra ngoại lệ hoặc đầu vào không hợp lệ."],
                ["turn_error", "message, recoverable",
                 "Lỗi nội bộ ở cấp lượt; cờ recoverable chỉ ra liệu vòng lặp có tiếp tục."],
                ["error", "message",
                 "Lỗi không khôi phục được; máy chủ kết thúc luồng ngay sau đó."],
                ["done", "inputTokens, outputTokens, turns",
                 "Sự kiện cuối cùng với thống kê sử dụng và số lượt đã chạy."],
            ],
            column_widths_cm=[3.0, 4.5, 8.0],
        )],
    ))

    s.children.append(Section(
        title="6.6. Quản lý phiên hội thoại", level=2,
        paragraphs=[
            "Phiên hội thoại được biểu diễn bởi một đối tượng có các trường "
            "id, apiMessages, cumulative, createdAt, lastActiveAt và "
            "persisted. SessionService duy trì bộ nhớ đệm Map cho các phiên "
            "đang hoạt động và sử dụng SessionStore làm tầng đĩa. Khi "
            "getOrCreate được gọi với một định danh, dịch vụ thử lấy từ bộ "
            "đệm; nếu không có thì thử tải từ đĩa; nếu vẫn không có thì "
            "khởi tạo phiên mới với một thông điệp hệ thống mặc định.",

            "Đối tượng SessionStore quản lý hai tệp cho mỗi phiên: tệp JSONL "
            "chứa các dòng header, message và compact; tệp meta.json chứa "
            "siêu dữ liệu thống kê. Hàm appendMessage đẩy một dòng vào hàng "
            "đợi nội bộ và đặt lịch xả sau một trăm mili-giây. Khi đến hạn, "
            "hàm drain gom các dòng theo từng tệp và thực hiện một lần ghi "
            "cho mỗi tệp. Hàm rewriteAfterCompaction trước tiên gọi drain "
            "để bảo đảm không còn ghi đệm nào, sau đó dùng writeFile để "
            "ghi lại toàn bộ tệp với danh sách thông điệp mới sau nén.",
        ],
    ))

    s.children.append(Section(
        title="6.7. Bản đồ phiên theo khách hàng", level=2,
        paragraphs=[
            "ClientSessionMap nhớ phiên gần nhất theo từng khách hàng để tự "
            "động duy trì mạch hội thoại khi khách hàng không truyền "
            "sessionId. Đoạn mã sau cho thấy cách định danh khách hàng "
            "được giải quyết theo thứ tự ưu tiên.",
        ],
        listings=[CodeListingSpec(
            caption="Giải quyết định danh khách hàng trong ClientSessionMap",
            language="TypeScript",
            code=(
                "resolveClientId(req) {\n"
                "  const explicit = req.header('x-client-id');\n"
                "  if (explicit) return 'header:' + explicit;\n"
                "  const ua = (req.header('user-agent') ?? 'unknown').slice(0, 80);\n"
                "  const ip = (req.header('x-forwarded-for') ?? req.ip ??\n"
                "              req.socket.remoteAddress ?? 'unknown')\n"
                "             .toString().split(',')[0].trim();\n"
                "  return ip + ':' + ua;\n"
                "}"
            ),
        )],
    ))

    s.children.append(Section(
        title="6.8. Định tuyến lệnh hội thoại", level=2,
        paragraphs=[
            "Khi tin nhắn người dùng bắt đầu bằng dấu gạch chéo, "
            "ChatController không đẩy nó vào QueryService mà ủy quyền cho "
            "CommandRegistry. Lớp này phân tách tên lệnh và chuỗi tham số "
            "rồi tìm trong bản đồ tên-lệnh hỗ trợ cả tên chính và bí danh. "
            "Mỗi lệnh trả về một kết quả thuộc một trong ba loại: text "
            "được phát qua sự kiện text_delta; compact kéo theo việc ghi "
            "lại tệp JSONL và phát thông báo nén; cleared phát thông báo "
            "xóa phiên. Cấu trúc này tách rõ luồng lệnh khỏi luồng mô hình "
            "và cho phép thêm lệnh mới mà không ảnh hưởng tới vòng lặp tác "
            "tử.",
        ],
    ))

    s.children.append(Section(
        title="6.9. Cấu hình môi trường", level=2,
        paragraphs=[
            "Cấu hình môi trường được kiểm chứng tại thời điểm khởi động "
            "bằng Zod. Bảng 6.3 liệt kê các biến môi trường và mục đích. "
            "Khi thiếu biến bắt buộc, máy chủ in lỗi rõ ràng và thoát ngay "
            "thay vì để các lỗi mơ hồ phát sinh muộn ở thời gian chạy.",
        ],
        tables=[TableSpec(
            caption="Biến môi trường được hỗ trợ",
            headers=["Biến", "Bắt buộc", "Mặc định", "Mục đích"],
            rows=[
                ["AI_API_KEY", "Có", "—", "Khóa xác thực với nhà cung cấp mô hình"],
                ["AI_API_URL", "Có", "—", "URL điểm cuối mô hình tương thích OpenAI"],
                ["AI_MODEL", "Có", "—", "Tên mô hình sử dụng"],
                ["PORT", "Không", "3000", "Cổng máy chủ HTTP"],
                ["NODE_ENV", "Không", "development", "Môi trường chạy"],
                ["WORKSPACE_ROOT", "Không", "cwd", "Thư mục làm việc cho các công cụ tệp"],
                ["SESSIONS_DIR", "Không", "~/.agentmini-nest/sessions",
                 "Thư mục lưu phiên JSONL"],
                ["BRAVE_SEARCH_API_KEY", "Không", "—",
                 "Khóa Brave Search; nếu thiếu, hệ thống tự rơi về DuckDuckGo"],
            ],
            column_widths_cm=[3.4, 1.7, 4.0, 6.4],
        )],
    ))

    s.children.append(Section(
        title="6.10. Bộ chống lặp công cụ", level=2,
        paragraphs=[
            "Một số mô hình yếu lặp lại lời gọi công cụ giống hệt nhau khi "
            "gặp khó khăn, dẫn đến tiêu tốn tài nguyên. Để chặn hiện tượng "
            "này, vòng lặp tác tử lưu một danh sách dấu vân tay gồm tên "
            "công cụ, chuỗi tham số và 200 ký tự đầu của kết quả. Nếu ba "
            "dấu vân tay liên tiếp giống hệt nhau, máy chủ chèn một thông "
            "điệp hệ thống nhắc mô hình thay đổi cách tiếp cận; nếu lặp "
            "lại đến lần thứ tư, máy chủ phát một sự kiện turn_error và "
            "dừng vòng lặp.",
        ],
    ))
    return s


# ── Chương 7: Kiểm thử ──────────────────────────────────────────────────────

def _ch7() -> Section:
    s = Section(title="Chương 7: Kiểm thử", level=1)

    s.children.append(Section(
        title="7.1. Phương pháp kiểm thử", level=2,
        paragraphs=[
            "Hệ thống được kiểm thử ở ba mức. Mức kiểm thử khói gồm các "
            "kịch bản đầu cuối kiểm tra các đường đi quan trọng. Mức kiểm "
            "thử nén ngữ cảnh và hủy đầu cuối tập trung vào các tình "
            "huống biên có thể gây rủi ro nếu bỏ qua. Mức kiểm tra kiểu "
            "được thực hiện liên tục bằng tsc --noEmit trong khi phát "
            "triển, đảm bảo tính an toàn về kiểu cho toàn bộ mã nguồn "
            "TypeScript.",

            "Bộ kiểm thử khói được chạy thủ công bằng curl và bằng tập "
            "lệnh shell tự động hóa. Mục tiêu là xác minh các đường đi "
            "quan trọng của hệ thống trước khi đi sâu vào các trường hợp "
            "biên.",
        ],
    ))

    s.tables.append(TableSpec(
        caption="Các kịch bản kiểm thử khói đã thực hiện",
        headers=["Kịch bản", "Mục tiêu", "Kết quả"],
        rows=[
            ["KT-01", "Khởi động máy chủ và liệt kê công cụ qua /api/chat/stats",
             "Trả về danh sách 12 công cụ và 8 lệnh"],
            ["KT-02", "Hỏi đáp văn bản đơn",
             "Mô hình phản hồi đúng nội dung; sự kiện done có usage hợp lệ"],
            ["KT-03", "Yêu cầu đếm tệp .ts qua công cụ Bash",
             "Bash trả về số lượng đúng; mô hình kết luận chính xác"],
            ["KT-04", "Tạo và sửa tệp xlsx qua nhiều lượt",
             "Tạo thành công, thêm dòng thành công, dữ liệu đọc lại đúng"],
            ["KT-05", "Khôi phục phiên sau khi khởi động lại máy chủ",
             "Lệnh /resume liệt kê được phiên; sessionId cũ giữ nguyên ngữ cảnh"],
            ["KT-06", "Tự động duy trì phiên khi không truyền sessionId",
             "ClientSessionMap nhận diện đúng và phiên được duy trì"],
            ["KT-07", "Kiểm tra cờ concurrencySafe",
             "/tools cho thấy bảy công cụ song song và năm công cụ tuần tự"],
        ],
        column_widths_cm=[2.4, 6.0, 6.6],
    ))

    s.children.append(Section(
        title="7.2. Kiểm thử nén ngữ cảnh", level=2,
        paragraphs=[
            "Để kiểm thử cơ chế nén, bộ ước lượng mã thông báo được điều "
            "chỉnh tạm thời để hạ ngưỡng xuống mức thấp, sau đó một loạt "
            "câu hỏi dài được gửi tới máy chủ. Khi tổng vượt ngưỡng, sự "
            "kiện tool_result với toolName AutoCompact được phát ra; sau "
            "đó tệp JSONL được ghi lại. Việc đọc lại tệp cho thấy chỉ còn "
            "các thông điệp hệ thống, thông điệp ranh giới chứa tóm tắt và "
            "đuôi gần nhất, đúng như thiết kế.",

            "Một biến thể được dùng để kiểm tra ngắt mạch của compact: "
            "lời nhắc tóm tắt được thay tạm thời bằng chuỗi rỗng để mô "
            "hình không trả về phản hồi hợp lệ. Sau ba lần thất bại liên "
            "tiếp, các lượt sau bỏ qua compact, đúng theo cài đặt "
            "MAX_CONSECUTIVE_FAILURES.",
        ],
    ))

    s.children.append(Section(
        title="7.3. Kiểm thử hủy giữa chừng", level=2,
        paragraphs=[
            "Người kiểm thử gửi một câu hỏi yêu cầu chạy lệnh sleep dài "
            "qua công cụ Bash, sau đó nhấn Ctrl+C ở phía khách hàng. Phía "
            "máy chủ phát hiện sự kiện close và phát tín hiệu hủy; lệnh "
            "sleep bị kết thúc bởi SIGTERM; máy chủ ghi lại thông điệp "
            "tool với nội dung chỉ rõ rằng công cụ đã bị hủy bởi khách "
            "hàng. Không có tiến trình con sót lại trong bảng tiến trình "
            "của hệ điều hành.",

            "Tương tự, một kịch bản dùng WebFetch tới một điểm cuối chậm "
            "được thực hiện. Khi khách hàng đóng kết nối, fetch của Node "
            "nhận AbortSignal và ném AbortError; máy chủ chuyển ngoại lệ "
            "này thành ToolResult với cờ isError=true.",
        ],
    ))

    s.children.append(Section(
        title="7.4. Kiểm thử chống lặp công cụ", level=2,
        paragraphs=[
            "Một kịch bản tổng hợp với mô hình kimi-k2.5 cho thấy mô hình "
            "lặp lại lời gọi verify Bash bốn lần liên tiếp với cùng tham "
            "số và cùng kết quả. Sau khi bộ chống lặp được bổ sung vào "
            "QueryService, kịch bản tương tự dừng đúng ở lượt thứ tư với "
            "sự kiện turn_error có nội dung mô tả rõ nguyên nhân; thông "
            "điệp nhắc nhở được chèn vào lịch sử ở lượt thứ ba có hiệu "
            "quả với một số mô hình khác có khả năng tự điều chỉnh.",
        ],
    ))
    return s


# ── Chương 8: Triển khai và vận hành ────────────────────────────────────────

def _ch8() -> Section:
    s = Section(title="Chương 8: Triển khai và vận hành", level=1)

    s.children.append(Section(
        title="8.1. Sơ đồ triển khai", level=2,
        paragraphs=[
            "Hình 8.1 trình bày sơ đồ triển khai dạng UML. Hệ thống có ba "
            "vùng triển khai: máy khách (trình duyệt, công cụ dòng lệnh "
            "hoặc tập lệnh tự động), máy chủ (chạy Node.js 20+ với tiến "
            "trình NestJS và các tiến trình con sinh ra bởi công cụ Bash), "
            "và các dịch vụ ngoài (nhà cung cấp mô hình, dịch vụ tìm kiếm, "
            "trang web bất kỳ). Ngoài ra còn có hệ thống tệp cục bộ chứa "
            "workspace, thư mục phiên và tệp cấu hình môi trường.",

            "Giao tiếp giữa máy khách và máy chủ là HTTP/SSE; giao tiếp "
            "giữa máy chủ và dịch vụ ngoài là HTTPS. Các tiến trình con "
            "do Bash sinh ra chạy với cùng quyền của tiến trình Node, "
            "trong cùng máy. Đây là điểm cần lưu ý về bảo mật và được "
            "thảo luận ở mục 8.5.",
        ],
    ))

    s.figures.append(FigureSpec(
        caption="Sơ đồ triển khai của hệ thống",
        image_path=FIG_DIR / "fig-deployment.png",
    ))

    s.children.append(Section(
        title="8.2. Quy trình cài đặt", level=2,
        paragraphs=[
            "Cài đặt hệ thống yêu cầu Node.js 20 trở lên. Các bước cài "
            "đặt: nhân bản kho mã, sao chép tệp .env.example thành .env "
            "và điền giá trị, chạy npm install, sau đó khởi động máy chủ "
            "bằng npm run dev cho môi trường phát triển hoặc npm run "
            "build && npm start cho môi trường sản xuất.",
        ],
        listings=[CodeListingSpec(
            caption="Các bước cài đặt cơ bản",
            language="bash",
            code=(
                "# 1. Lấy mã nguồn\n"
                "git clone <repo-url> agentmini-nest\n"
                "cd agentmini-nest\n"
                "\n"
                "# 2. Cài phụ thuộc\n"
                "npm install\n"
                "\n"
                "# 3. Cấu hình môi trường\n"
                "cp .env.example .env\n"
                "vim .env   # đặt AI_API_KEY, AI_API_URL, AI_MODEL\n"
                "\n"
                "# 4. Chạy phát triển (hot reload)\n"
                "npm run dev\n"
                "\n"
                "# 4b. Hoặc chạy sản xuất\n"
                "npm run build\n"
                "npm start"
            ),
        )],
    ))

    s.children.append(Section(
        title="8.3. Theo dõi và nhật ký", level=2,
        paragraphs=[
            "NestJS ghi nhật ký mặc định ra đầu ra chuẩn theo định dạng "
            "có màu sắc trong môi trường phát triển và định dạng văn bản "
            "trong môi trường sản xuất. Các sự kiện đáng chú ý gồm: khởi "
            "động máy chủ với danh sách công cụ và lệnh đã đăng ký, kết "
            "nối mới qua /api/chat, lỗi kiểm chứng đầu vào, lỗi gọi mô "
            "hình ngôn ngữ, sự kiện nén thành công hoặc thất bại, và "
            "thoát thông qua tín hiệu hủy.",

            "Để mở rộng theo dõi cho môi trường sản xuất, có thể bổ sung "
            "một mô-đun ghi nhật ký có cấu trúc (pino hoặc winston) và "
            "một điểm cuối /metrics theo định dạng Prometheus. Các chỉ "
            "số đáng quan tâm gồm: tổng số lượt mỗi giây, độ trễ trung "
            "bình của mỗi công cụ, tỉ lệ nén thành công, số phiên đang "
            "hoạt động.",
        ],
    ))

    s.children.append(Section(
        title="8.4. Bảo trì và sao lưu", level=2,
        paragraphs=[
            "Vì toàn bộ trạng thái phiên nằm trong thư mục SESSIONS_DIR, "
            "việc sao lưu chỉ cần đồng bộ thư mục đó tới một vị trí dự "
            "phòng. Cron job hàng ngày sao chép thư mục sang một máy "
            "khác hoặc lên dịch vụ lưu trữ đối tượng là đủ. Vì JSONL "
            "tăng kích thước theo thời gian, nên có một quy trình dọn "
            "dẹp các phiên không còn cần thiết. Một tập lệnh đơn giản "
            "có thể xóa các phiên có lastActiveAt cũ hơn ngưỡng nhất "
            "định.",

            "Đối với nâng cấp, vì máy chủ không lưu trạng thái dài hạn "
            "trong bộ nhớ ngoài bản đồ phiên theo khách hàng, có thể "
            "khởi động lại an toàn mọi lúc. Phiên đang hoạt động sẽ bị "
            "ngắt nhưng có thể tiếp tục bằng cách gửi lại tin nhắn với "
            "cùng sessionId.",
        ],
    ))

    s.children.append(Section(
        title="8.5. An toàn", level=2,
        paragraphs=[
            "Vì hệ thống chưa có lớp xác thực, không nên phơi bày trực "
            "tiếp ra mạng công cộng. Các phương án triển khai an toàn "
            "trong môi trường nội bộ gồm: chạy sau bộ định tuyến ngược "
            "có xác thực (nginx với basic auth), chạy sau VPN, hoặc gắn "
            "vào mạng cục bộ chỉ truy cập được trong văn phòng.",

            "Công cụ Bash là điểm rủi ro lớn nhất. Người dùng có thể yêu "
            "cầu mô hình chạy bất kỳ lệnh nào trong WORKSPACE_ROOT, kể "
            "cả các lệnh có thể gây hại. Để giảm rủi ro, nên đặt "
            "WORKSPACE_ROOT trong một thư mục dùng riêng, không chứa "
            "tệp nhạy cảm; chạy máy chủ dưới một người dùng có quyền "
            "hạn chế; và xem xét cô lập trong một container Docker.",

            "Khóa AI_API_KEY phải được bảo vệ. Đặt nó trong .env và "
            "không commit vào kho mã. Khi triển khai trên máy chủ "
            "thật, dùng cơ chế quản lý bí mật như AWS Secrets Manager "
            "hoặc HashiCorp Vault thay vì để khóa trong tệp văn bản.",
        ],
    ))
    return s


# ── Chương 9: Đánh giá ──────────────────────────────────────────────────────

def _ch9() -> Section:
    s = Section(title="Chương 9: Đánh giá", level=1)

    s.children.append(Section(
        title="9.1. Đánh giá chức năng", level=2,
        paragraphs=[
            "Hệ thống đáp ứng đầy đủ mười bốn yêu cầu chức năng và mười "
            "một yêu cầu phi chức năng đã đề ra. Việc gọi công cụ song "
            "song giảm độ trễ rõ rệt khi mô hình yêu cầu nhiều công cụ "
            "chỉ đọc cùng lúc; trên một máy phát triển thông thường, ba "
            "công cụ Glob, Grep và LS chạy đồng thời cho kết quả nhanh "
            "hơn xấp xỉ ba lần so với chế độ tuần tự, do tổng thời gian "
            "I/O không bị xếp chồng.",

            "Nén ngữ cảnh cho thấy hiệu quả rõ rệt trên các phiên dài. "
            "Trong một phiên thử nghiệm với một trăm ba mươi hai thông "
            "điệp tích lũy khoảng hai mươi lăm nghìn mã thông báo, "
            "microCompact rút gọn các kết quả Bash dài và giảm tổng số "
            "xuống còn khoảng mười lăm nghìn mã thông báo, đủ để tránh "
            "cần compact đầy đủ. Đây là một bằng chứng cho thấy "
            "microCompact đáng tin cậy cho phần lớn các trường hợp thực "
            "tế và compact đầy đủ chỉ cần dùng cho các phiên rất dài.",
        ],
    ))

    s.children.append(Section(
        title="9.2. Đánh giá khả năng chịu lỗi", level=2,
        paragraphs=[
            "Cơ chế thử lại với độ trễ tăng dần che được phần lớn lỗi "
            "tạm thời ở tầng nhà cung cấp mô hình. Cơ chế giới hạn kích "
            "thước kết quả công cụ ở mức một trăm nghìn ký tự đã chặn "
            "được trường hợp một lệnh ls trên thư mục lớn làm lụt cửa "
            "sổ ngữ cảnh. Cơ chế chống lặp công cụ giúp kiểm soát hiện "
            "tượng lặp ở các mô hình yếu.",

            "Tín hiệu hủy đầu cuối hoạt động ổn định trong các kịch bản "
            "kiểm thử thủ công: không có tiến trình con sót lại sau khi "
            "hủy Bash; fetch của WebFetch dừng ngay; thời gian đệm của "
            "Sleep được giải phóng tức thì. Đây là điểm khác biệt đáng "
            "kể so với một số sản phẩm tương tự không truyền tín hiệu "
            "hủy xuống tận tầng công cụ.",
        ],
    ))

    s.children.append(Section(
        title="9.3. So sánh với Claude Code", level=2,
        paragraphs=[
            "AgentMini-Nest cài đặt được phần lớn các tính năng cốt lõi "
            "của Claude Code với khoảng ba nghìn dòng mã TypeScript, so "
            "với hàng vạn dòng của bản gốc. Sự khác biệt nằm ở các tính "
            "năng nâng cao không thuộc lõi: hệ thống skill, plugin, IDE "
            "bridge, hooks pre và post tool, sub-agent qua Task, voice "
            "mode, quản lý sandbox quyền tệp, theo dõi chi phí phía nhà "
            "cung cấp. Phạm vi của AgentMini-Nest là minh họa lõi, do "
            "đó các tính năng này được liệt kê làm hướng phát triển.",
        ],
    ))

    s.children.append(Section(
        title="9.4. Hạn chế", level=2,
        paragraphs=[
            "Hệ thống hiện chưa có lớp xác thực, do đó chỉ phù hợp cho "
            "môi trường phát triển hoặc nội bộ. Bản đồ phiên theo khách "
            "hàng dựa trên kết hợp địa chỉ IP và chuỗi User-Agent có "
            "thể không chính xác đằng sau bộ định tuyến chia sẻ; tiêu "
            "đề X-Client-Id nên được khuyến nghị cho khách hàng có yêu "
            "cầu cao về cách ly.",

            "Công cụ TodoWrite chia sẻ một biến trạng thái toàn cục về "
            "phiên đang hoạt động, dẫn đến điều kiện đua khi nhiều phiên "
            "gọi đồng thời. Giải pháp đề xuất trong chương kết luận là "
            "dùng AsyncLocalStorage của Node để cô lập ngữ cảnh phiên "
            "theo từng yêu cầu HTTP.",

            "Cơ chế Bash hiện không cô lập tiến trình con; người dùng "
            "có khả năng chạy lệnh tùy ý trong WORKSPACE_ROOT. Trong "
            "môi trường đa người dùng, cần cô lập sandbox bằng Docker "
            "hoặc một giải pháp tương đương.",
        ],
    ))
    return s


# ── Chương 10: Hướng dẫn sử dụng ────────────────────────────────────────────

def _ch10() -> Section:
    s = Section(title="Chương 10: Hướng dẫn sử dụng", level=1)

    s.children.append(Section(
        title="10.1. Khởi động máy chủ", level=2,
        paragraphs=[
            "Sau khi đã cài đặt theo mục 8.2, máy chủ được khởi động bằng "
            "npm run dev. Trong vài giây đầu, NestJS in nhật ký khởi tạo "
            "lần lượt các mô-đun và kết thúc bằng thông điệp xác nhận máy "
            "chủ đã sẵn sàng ở cổng 3000 (mặc định). Có thể đổi cổng bằng "
            "biến môi trường PORT.",
        ],
    ))

    s.children.append(Section(
        title="10.2. Gửi tin nhắn đầu tiên", level=2,
        paragraphs=[
            "Cách đơn giản nhất là gửi yêu cầu POST đến điểm cuối /api/chat "
            "kèm tin nhắn trong thân JSON. curl với cờ -N hiển thị luồng "
            "SSE theo thời gian thực.",
        ],
        listings=[CodeListingSpec(
            caption="Gửi tin nhắn đầu tiên qua curl",
            language="bash",
            code=(
                "curl -N -X POST http://localhost:3000/api/chat \\\n"
                "  -H 'Content-Type: application/json' \\\n"
                "  -d '{\"message\":\"Xin chào, bạn là ai?\"}'"
            ),
        )],
    ))

    s.children.append(Section(
        title="10.3. Duy trì hội thoại nhiều lượt", level=2,
        paragraphs=[
            "Hệ thống tự nhớ phiên gần nhất theo từng khách hàng. Lượt "
            "tiếp theo có thể bỏ trường sessionId; máy chủ sẽ tự khớp với "
            "phiên đã tạo trước đó.",
        ],
        listings=[CodeListingSpec(
            caption="Tiếp tục cùng một phiên ở lượt tiếp theo",
            language="bash",
            code=(
                "# Lượt 1\n"
                "curl -N -X POST http://localhost:3000/api/chat \\\n"
                "  -d '{\"message\":\"Đếm tệp .ts trong thư mục src\"}'\n"
                "\n"
                "# Lượt 2 (cùng phiên — không cần sessionId)\n"
                "curl -N -X POST http://localhost:3000/api/chat \\\n"
                "  -d '{\"message\":\"Trong số đó, có bao nhiêu tệp test?\"}'"
            ),
        )],
    ))

    s.children.append(Section(
        title="10.4. Sử dụng các lệnh hội thoại", level=2,
        paragraphs=[
            "Lệnh hội thoại bắt đầu bằng dấu gạch chéo. Một số lệnh thường "
            "dùng được liệt kê bên dưới. Lệnh /help in danh sách đầy đủ.",
        ],
        listings=[CodeListingSpec(
            caption="Một số ví dụ lệnh hội thoại",
            language="bash",
            code=(
                "# Xem chi phí mã thông báo của phiên hiện tại\n"
                "curl -X POST http://localhost:3000/api/chat -d '{\"message\":\"/cost\"}'\n"
                "\n"
                "# Liệt kê phiên đã lưu trên đĩa\n"
                "curl -X POST http://localhost:3000/api/chat -d '{\"message\":\"/resume\"}'\n"
                "\n"
                "# Xuất bản lịch sử phiên hiện tại dưới dạng JSON\n"
                "curl -X POST http://localhost:3000/api/chat -d '{\"message\":\"/export\"}'\n"
                "\n"
                "# Nén ngữ cảnh thủ công với chỉ dẫn riêng\n"
                "curl -X POST http://localhost:3000/api/chat \\\n"
                "  -d '{\"message\":\"/compact Tập trung vào lỗi gặp phải và cách sửa\"}'"
            ),
        )],
    ))

    s.children.append(Section(
        title="10.5. Sử dụng công cụ dòng lệnh", level=2,
        paragraphs=[
            "Dự án bao gồm một công cụ dòng lệnh trong thư mục bin/ giúp "
            "tiện hơn so với gõ curl. Công cụ tự nhớ sessionId gần nhất "
            "trong tệp ~/.agentmini-nest/.last-session, do đó các lệnh "
            "kế tiếp tự dùng cùng một phiên.",
        ],
        listings=[CodeListingSpec(
            caption="Các lệnh dòng lệnh tiêu biểu",
            language="bash",
            code=(
                "# Đặt công cụ vào PATH (một lần)\n"
                "export PATH=\"$PWD/bin:$PATH\"\n"
                "\n"
                "# Lượt 1: phiên mới\n"
                "agentmini -n \"Tạo file demo.csv với 5 dòng dữ liệu mẫu\"\n"
                "\n"
                "# Lượt 2: tự tiếp tục phiên trước\n"
                "agentmini \"Thêm cột mới tên Status\"\n"
                "\n"
                "# Liệt kê phiên đã lưu\n"
                "agentmini --list\n"
                "\n"
                "# Trạng thái máy chủ\n"
                "agentmini --stats"
            ),
        )],
    ))
    return s


# ── Chương 11: Kết luận và hướng phát triển ─────────────────────────────────

def _ch11() -> Section:
    s = Section(title="Chương 11: Kết luận và hướng phát triển", level=1)

    s.children.append(Section(
        title="11.1. Kết luận", level=2,
        paragraphs=[
            "Đề tài đã xây dựng một máy chủ tác tử AI với cấu trúc rõ "
            "ràng, cài đặt đầy đủ vòng lặp tác tử bằng hàm sinh bất đồng "
            "bộ, mười hai công cụ cốt lõi, tám lệnh hội thoại, cơ chế nén "
            "ngữ cảnh tự động và thủ công, tầng lưu trữ JSONL với khả "
            "năng khôi phục, bản đồ phiên theo khách hàng và cơ chế hủy "
            "đầu cuối. Bộ mã đáp ứng các nguyên tắc mô-đun của NestJS, "
            "dễ đọc và dễ mở rộng. Hệ thống đã được kiểm thử khói và "
            "kiểm thử các trường hợp biên quan trọng với kết quả đạt yêu "
            "cầu.",

            "Quá trình thực hiện đề tài đã giúp người làm hiểu sâu hơn về "
            "kiến trúc tác tử AI, các đánh đổi giữa các mô hình lập "
            "trình (hàm sinh bất đồng bộ so với đồ thị trạng thái), các "
            "cơ chế bảo đảm tính nhất quán trong môi trường bất đồng bộ, "
            "và thực tiễn thiết kế công cụ cho mô hình ngôn ngữ.",
        ],
    ))

    s.children.append(Section(
        title="11.2. Hướng phát triển", level=2,
        paragraphs=[
            "Trong giai đoạn tiếp theo, các hạng mục được sắp xếp thành "
            "ba nhóm theo mức ưu tiên. Nhóm thứ nhất về tăng cường vận "
            "hành: bổ sung lớp xác thực bằng khóa API hoặc JWT cùng với "
            "giới hạn tốc độ; thay biến trạng thái toàn cục của "
            "TodoWrite bằng cơ chế AsyncLocalStorage; bổ sung nhật ký "
            "kiểm toán và đo lường Prometheus.",

            "Nhóm thứ hai về tính năng tác tử: tích hợp giao thức Model "
            "Context Protocol cho phép gắn các máy chủ công cụ bên thứ "
            "ba; bổ sung công cụ Task để tạo tác tử con với ngữ cảnh "
            "riêng; bổ sung hệ thống hooks pre và post tool cho phép tổ "
            "chức quy trình kiểm soát; bổ sung công cụ AskUserQuestion "
            "cho các tình huống cần xác nhận từ người dùng.",

            "Nhóm thứ ba về quy mô và tích hợp: bổ sung lớp lưu trữ "
            "phiên trên Redis để hỗ trợ vận hành nhiều phiên bản; cô "
            "lập sandbox tiến trình Bash bằng Docker; tích hợp cơ sở dữ "
            "liệu véc-tơ để hỗ trợ tìm kiếm theo ngữ nghĩa khi có kho "
            "tri thức bên ngoài; phát triển giao diện web nhẹ để hiển "
            "thị nhật ký luồng và chi phí theo thời gian thực.",
        ],
    ))
    return s


# ── Phụ lục ──────────────────────────────────────────────────────────────────

def _appendix() -> Section:
    s = Section(title="Phụ lục: Tham chiếu công cụ và lệnh", level=1)

    s.children.append(Section(
        title="A. Tham chiếu mười hai công cụ", level=2,
        paragraphs=[
            "Bảng A.1 liệt kê toàn bộ công cụ với cờ đặc trưng. Cờ song "
            "song an toàn xác định liệu công cụ có được phép chạy đồng "
            "thời với công cụ khác trong cùng một lượt; các công cụ chỉ "
            "ghi luôn được đặt là tuần tự để bảo toàn ngữ nghĩa thứ tự.",
        ],
        tables=[TableSpec(
            caption="Tham chiếu mười hai công cụ",
            headers=["Tên", "Chỉ đọc", "Song song an toàn", "Mô tả ngắn gọn"],
            rows=[
                ["Bash", "Không", "Không",
                 "Chạy lệnh shell trong workspace; bị giới hạn thời gian và kích thước đầu ra."],
                ["Read", "Có", "Có",
                 "Đọc tệp văn bản theo định dạng cat -n; hỗ trợ offset và limit."],
                ["Write", "Không", "Không",
                 "Tạo mới hoặc ghi đè tệp; tự tạo thư mục cha."],
                ["Edit", "Không", "Không",
                 "Thay thế chuỗi chính xác; yêu cầu chuỗi nguồn duy nhất hoặc cờ replace_all."],
                ["MultiEdit", "Không", "Không",
                 "Áp dụng nhiều bản chỉnh sửa lên một tệp theo nguyên tắc atomic."],
                ["Glob", "Có", "Có",
                 "Tìm tệp theo mẫu glob; sắp xếp theo thời gian sửa đổi."],
                ["Grep", "Có", "Có",
                 "Tìm nội dung qua ripgrep với fallback grep; ba chế độ đầu ra."],
                ["LS", "Có", "Có", "Liệt kê thư mục với thông tin kích thước."],
                ["WebFetch", "Có", "Có",
                 "Tải URL, chuyển HTML sang văn bản, phát hiện chuyển hướng khác máy chủ."],
                ["WebSearch", "Có", "Có",
                 "Tìm kiếm web qua Brave hoặc DuckDuckGo, lọc theo miền."],
                ["TodoWrite", "Không", "Không",
                 "Quản lý danh sách công việc của phiên với ràng buộc một nhiệm vụ đang thực hiện."],
                ["Sleep", "Có", "Có",
                 "Tạm dừng từ 50 mili-giây đến 60 giây; tôn trọng tín hiệu hủy."],
            ],
            column_widths_cm=[2.4, 1.8, 2.6, 8.2],
        )],
    ))

    s.children.append(Section(
        title="B. Tham chiếu tám lệnh hội thoại", level=2,
        tables=[TableSpec(
            caption="Tham chiếu tám lệnh hội thoại",
            headers=["Lệnh", "Bí danh", "Mô tả"],
            rows=[
                ["/help", "/?", "Liệt kê các lệnh có sẵn cùng mô tả ngắn"],
                ["/clear", "/reset, /new",
                 "Xóa lịch sử hội thoại và danh sách công việc của phiên hiện tại"],
                ["/compact", "—", "Nén ngữ cảnh thủ công, có thể truyền chỉ dẫn riêng"],
                ["/cost", "/usage", "Hiển thị tổng mã thông báo đã dùng và tỉ lệ ngữ cảnh"],
                ["/model", "—", "Hiển thị mô hình đang dùng và URL điểm cuối"],
                ["/tools", "—", "Hiển thị mười hai công cụ với cờ song song an toàn"],
                ["/resume", "—",
                 "Liệt kê các phiên đã lưu trên đĩa, sắp xếp theo lần hoạt động cuối"],
                ["/export", "—",
                 "Xuất bản hội thoại hiện tại dưới dạng JSON qua sự kiện text_delta"],
            ],
            column_widths_cm=[2.4, 3.0, 9.6],
        )],
    ))

    s.children.append(Section(
        title="C. Điểm cuối HTTP", level=2,
        tables=[TableSpec(
            caption="Các điểm cuối HTTP của máy chủ",
            headers=["Phương thức", "Đường dẫn", "Mô tả"],
            rows=[
                ["POST", "/api/chat",
                 "Gửi tin nhắn người dùng; trả về luồng SSE với các sự kiện text_delta, tool_start, tool_result, done"],
                ["GET", "/api/chat/stats",
                 "Trả về trạng thái máy chủ: số phiên đang hoạt động, số phiên đã lưu, danh sách công cụ và lệnh"],
                ["GET", "/api/chat/sessions",
                 "Liệt kê siêu dữ liệu của tất cả phiên đã lưu trên đĩa"],
                ["DELETE", "/api/chat/:sessionId",
                 "Xóa một phiên khỏi cả bộ nhớ và đĩa"],
            ],
            column_widths_cm=[2.0, 4.4, 8.6],
        )],
    ))

    s.children.append(Section(
        title="D. Biến môi trường", level=2,
        tables=[TableSpec(
            caption="Biến môi trường được hỗ trợ",
            headers=["Biến", "Bắt buộc", "Mặc định", "Mục đích"],
            rows=[
                ["AI_API_KEY", "Có", "—", "Khóa xác thực với nhà cung cấp mô hình"],
                ["AI_API_URL", "Có", "—", "URL điểm cuối mô hình tương thích OpenAI"],
                ["AI_MODEL", "Có", "—", "Tên mô hình sử dụng"],
                ["PORT", "Không", "3000", "Cổng máy chủ HTTP"],
                ["NODE_ENV", "Không", "development", "Môi trường chạy"],
                ["WORKSPACE_ROOT", "Không", "cwd", "Thư mục làm việc cho các công cụ tệp"],
                ["SESSIONS_DIR", "Không", "~/.agentmini-nest/sessions",
                 "Thư mục lưu phiên JSONL"],
                ["BRAVE_SEARCH_API_KEY", "Không", "—",
                 "Khóa Brave Search; nếu thiếu, hệ thống tự rơi về DuckDuckGo"],
            ],
            column_widths_cm=[3.4, 1.7, 4.0, 6.4],
        )],
    ))
    return s


# ── Tài liệu tham khảo ───────────────────────────────────────────────────────

def _references() -> list[str]:
    return [
        "Anthropic. Claude Code: agent-based coding assistant. Tài liệu kỹ thuật trực tuyến, 2025.",
        "OpenAI. Function calling and tool use specification. Tài liệu API, 2024.",
        "NestJS team. NestJS official documentation. https://docs.nestjs.com",
        "WHATWG. HTML Living Standard, Server-Sent Events. https://html.spec.whatwg.org/multipage/server-sent-events.html",
        "ECMA. ECMAScript 2018 specification, async generators.",
        "Andrew Gallant. ripgrep: a line-oriented search tool. https://github.com/BurntSushi/ripgrep",
        "Mauro Bringolf. fast-glob: high-performance glob library for Node.js.",
        "Colin Ihrig. Zod: TypeScript-first schema validation. https://zod.dev",
        "LangChain team. LangChain Python and JavaScript libraries documentation. https://python.langchain.com",
        "OpenAI. Assistants API reference. https://platform.openai.com/docs/assistants",
        "Anthropic. Model Context Protocol specification. https://modelcontextprotocol.io",
        "Node.js team. AbortSignal and AbortController in Node.js. https://nodejs.org/api/globals.html",
    ]
