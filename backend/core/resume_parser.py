import re
import os
import base64
from pathlib import Path

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"

# Try to import OCR libraries
try:
    import pytesseract
    from PIL import Image
    import pdf2image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

try:
    from PyPDF2 import PdfReader
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False


TECH_SKILLS = [
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "golang", "rust", "kotlin", "swift", "scala", "r", "matlab",
    "react", "reactjs", "angular", "vue", "vuejs", "node.js", "nodejs", "express", "django", "flask", "fastapi", "spring", "spring boot",
    "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "cassandra", "dynamodb", "sqlite", "oracle",
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s", "terraform", "ansible", "jenkins", "github actions", "ci/cd",
    "machine learning", "deep learning", "nlp", "computer vision", "pytorch", "tensorflow", "keras", "scikit-learn",
    "langchain", "llm", "generative ai", "gen ai", "rag", "transformers", "hugging face", "huggingface", "openai", "gpt",
    "pandas", "numpy", "matplotlib", "seaborn", "tableau", "power bi", "looker", "metabase",
    "git", "github", "gitlab", "bitbucket", "linux", "bash", "shell scripting",
    "html", "css", "tailwind", "bootstrap", "sass",
    "rest api", "graphql", "microservices", "system design", "distributed systems",
    "data structures", "algorithms", "leetcode", "competitive programming",
    "prompt engineering", "fine-tuning", "lora", "qlora", "vector database", "pinecone", "chromadb", "weaviate", "qdrant", "milvus",
    "opencv", "yolo", "stable diffusion", "diffusion models", "gan", "gans",
    "spark", "apache spark", "hadoop", "kafka", "airflow", "dbt", "snowflake", "databricks",
    "figma", "ui/ux", "sketch", "adobe xd", "prototyping",
    "blockchain", "solidity", "web3", "ethereum", "smart contracts",
    "cybersecurity", "penetration testing", "ethical hacking", "soc", "siem",
    "react native", "flutter", "android", "ios", "swift",
    "mlflow", "mlops", "kubeflow", "sagemaker", "vertex ai",
    "agile", "scrum", "jira", "confluence",
    "excel", "vba", "power query", "powerpoint",
    "c", "embedded c", "rtos", "arm", "arduino", "raspberry pi",
    "unity", "unreal engine", "opengl", "webgl",
    "photoshop", "illustrator", "indesign", "after effects", "premiere pro",
    "selenium", "pytest", "junit", "cypress", "testing",
    "grpc", "rabbitmq", "celery", "nginx", "apache"
]

ROLE_KEYWORDS = {
    "data_analyst": ["data analyst", "business analyst", "analytics", "dashboard", "tableau", "power bi", "sql analyst", "report analyst"],
    "data_scientist": ["data scientist", "data science", "statistical modeling", "predictive", "machine learning"],
    "ai_engineer": ["ai engineer", "artificial intelligence engineer", "deep learning engineer", "ai developer"],
    "ml_engineer": ["ml engineer", "machine learning engineer", "mlops", "model deployment", "feature engineering"],
    "gen_ai_developer": ["generative ai", "gen ai", "llm", "langchain", "llamaindex", "rag", "prompt engineer", "chatbot", "llm developer", "ai developer"],
    "software_engineer": ["software engineer", "software developer", "sde", "swe", "backend developer", "frontend developer", "full stack", "fullstack"],
    "devops_engineer": ["devops", "site reliability", "sre", "platform engineer", "cloud engineer", "infrastructure engineer"],
    "computer_vision_engineer": ["computer vision", "image processing", "opencv", "yolo", "vision ai"],
    "nlp_engineer": ["nlp", "natural language processing", "text mining", "sentiment analysis", "nlp engineer"],
    "cloud_architect": ["cloud architect", "aws architect", "azure architect", "cloud solution", "solutions architect"],
    "security_analyst": ["security analyst", "cybersecurity", "penetration tester", "ethical hacker", "soc analyst", "information security"],
    "data_engineer": ["data engineer", "data pipeline", "etl", "data warehouse", "spark engineer", "data platform"],
    "product_manager": ["product manager", "product management", "product owner", "pm", "product lead"],
    "mobile_developer": ["mobile developer", "android developer", "ios developer", "react native", "flutter developer"],
    "blockchain_developer": ["blockchain", "solidity", "web3", "smart contract", "defi", "ethereum developer"],
    "game_developer": ["game developer", "game development", "unity developer", "unreal developer", "game programmer"],
    "ui_ux_designer": ["ui designer", "ux designer", "ui/ux", "user experience", "product designer", "interaction designer", "figma"],
    "research_scientist": ["research scientist", "research engineer", "researcher", "phd", "publications"],
    "mlops_engineer": ["mlops", "ml platform", "model deployment", "model monitoring", "kubeflow", "mlflow"],
    "embedded_engineer": ["embedded", "firmware", "rtos", "arm", "microcontroller", "fpga", "iot firmware"],
    "full_stack_developer": ["full stack", "fullstack", "mern", "mean", "frontend", "backend"],
}

EDUCATION_KEYWORDS = [
    "b.tech", "btech",
    "b.sc", "bsc", "bachelor of science",
    "bca", "mca",
    "mbbs", "bds", "b.pharma", "nursing",
    "12th", "hsc", "higher secondary", "plus two",
    "10th", "ssc",
    "diploma",
    "iit", "nit", "bits", "vit", "srm", "amrita", "sastra", "karunya"
]

COMPANY_KEYWORDS = [
    "google", "microsoft", "amazon", "meta", "apple", "netflix", "uber", "linkedin", "twitter",
    "infosys", "tcs", "wipro", "hcl", "tech mahindra", "cognizant", "accenture",
    "flipkart", "swiggy", "zomato", "razorpay", "phonepe", "paytm", "ola", "cred", "meesho",
    "zoho", "freshworks", "cleartax", "browserstack",
    "openai", "anthropic", "deepmind", "nvidia", "intel", "qualcomm",
    "deloitte", "ey", "pwc", "kpmg", "mckinsey", "bcg", "bain"
]


def extract_text_pypdf2(file_path: str) -> str:
    """Extract text using PyPDF2."""
    if not PYPDF2_AVAILABLE:
        return ""
    text = ""
    try:
        reader = PdfReader(file_path)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception as e:
        print(f"PyPDF2 error: {e}")
    return text


def extract_text_ocr(file_path: str) -> str:
    """Extract text using OCR (pytesseract + pdf2image)."""
    if not OCR_AVAILABLE:
        return ""
    text = ""
    try:
        images = pdf2image.convert_from_path(file_path, dpi=300)
        for img in images:
            page_text = pytesseract.image_to_string(img, lang='eng', config='--psm 6')
            text += page_text + "\n"
    except Exception as e:
        print(f"OCR error: {e}")
    return text


def extract_text(file_path: str) -> dict:
    """Try PyPDF2 first, fallback to OCR."""
    # Try PyPDF2 first (faster)
    text = extract_text_pypdf2(file_path)
    
    method_used = "pypdf2"
    
    # If text is too short (image-based PDF), try OCR
    if len(text.strip()) < 100 and OCR_AVAILABLE:
        ocr_text = extract_text_ocr(file_path)
        if len(ocr_text.strip()) > len(text.strip()):
            text = ocr_text
            method_used = "ocr"
    
    return {"text": text, "method": method_used}


def extract_contact_info(text: str) -> dict:
    """Extract name, email, phone from resume text."""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    phone_pattern = r'(?:(?:\+91|0)?[\s\-]?)?[6-9]\d{9}'
    linkedin_pattern = r'linkedin\.com/in/[\w\-]+'
    github_pattern = r'github\.com/[\w\-]+'
    
    emails = re.findall(email_pattern, text)
    phones = re.findall(phone_pattern, text.replace(' ', '').replace('-', ''))
    linkedin = re.findall(linkedin_pattern, text.lower())
    github = re.findall(github_pattern, text.lower())
    
    # Try to extract name (usually first 2-3 lines)
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    candidate_name = ""
    for line in lines[:5]:
        if 3 <= len(line.split()) <= 4 and not any(c in line for c in ['@', '+', '|', '/', '.']):
            words = line.split()
            if all(w[0].isupper() for w in words if w):
                candidate_name = line
                break
    
    return {
        "name": candidate_name,
        "email": emails[0] if emails else "",
        "phone": phones[0] if phones else "",
        "linkedin": linkedin[0] if linkedin else "",
        "github": github[0] if github else ""
    }


def extract_experience_years(text: str) -> int:
    """Extract years of experience."""
    text_lower = text.lower()
    
    exp_patterns = [
        r'(\d+)\+?\s*years?\s*(?:of\s*)?(?:work\s*)?experience',
        r'(\d+)\+?\s*years?\s*(?:in\s*)?(?:software|tech|it|development|industry)',
        r'experience\s*[:\-]?\s*(\d+)\+?\s*years?',
        r'(\d+)\+?\s*yrs?\s*(?:of\s*)?experience',
    ]
    
    for pattern in exp_patterns:
        match = re.search(pattern, text_lower)
        if match:
            return int(match.group(1))
    
    # Count job positions with dates to estimate experience
    date_pattern = r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s*[\'\,]?\s*(\d{4})'
    dates = re.findall(date_pattern, text_lower)
    
    if len(dates) >= 2:
        years = [int(d[1]) for d in dates]
        exp = max(years) - min(years)
        if 0 < exp < 40:
            return exp
    
    return 0


def extract_education_details(text: str) -> list:
    """Extract education qualifications."""
    text_lower = text.lower()
    found = []
    for keyword in EDUCATION_KEYWORDS:
        if keyword.lower() in text_lower:
            found.append(keyword)
    
    # Deduplicate
    return list(set(found))


def extract_companies_worked(text: str) -> list:
    """Extract companies the person has worked at."""
    text_lower = text.lower()
    found = []
    for company in COMPANY_KEYWORDS:
        if company.lower() in text_lower:
            found.append(company.title())
    return found


def get_pdf_as_base64(file_path: str) -> str:
    """Convert PDF file to base64 for frontend display."""
    try:
        with open(file_path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')
    except Exception:
        return ""


def parse_resume(file_path: str) -> dict:
    """Full resume parser with OCR support."""
    
    # Extract text
    extraction = extract_text(file_path)
    text = extraction["text"]
    method_used = extraction["method"]
    
    if not text.strip():
        return {
            "error": "Could not extract text from PDF. The file may be corrupted.",
            "ocr_available": OCR_AVAILABLE
        }
    
    text_lower = text.lower()
    
    # Extract skills
    found_skills = []
    for skill in TECH_SKILLS:
        if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text_lower):
            found_skills.append(skill)
    
    # Remove duplicates preserving order
    seen = set()
    unique_skills = []
    for s in found_skills:
        if s.lower() not in seen:
            seen.add(s.lower())
            unique_skills.append(s)
    found_skills = unique_skills
    
    # Extract info
    contact_info = extract_contact_info(text)
    experience_years = extract_experience_years(text)
    education = extract_education_details(text)
    companies_worked = extract_companies_worked(text)
    
    # Match to roles
    role_scores = {}
    for role_id, keywords in ROLE_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            if keyword.lower() in text_lower:
                score += 2
        # Also score by skills
        skill_map = {
            "gen_ai_developer": ["langchain", "llm", "generative ai", "rag", "prompt engineering"],
            "ml_engineer": ["pytorch", "tensorflow", "scikit-learn", "mlops", "mlflow"],
            "data_analyst": ["tableau", "power bi", "sql", "pandas", "excel"],
            "software_engineer": ["git", "docker", "rest api", "microservices", "agile"],
            "data_engineer": ["spark", "kafka", "airflow", "dbt", "snowflake"],
            "devops_engineer": ["kubernetes", "terraform", "jenkins", "ci/cd", "ansible"],
            "security_analyst": ["cybersecurity", "soc", "siem", "penetration testing"],
        }
        for related_skill in skill_map.get(role_id, []):
            if related_skill.lower() in text_lower:
                score += 1
        if score > 0:
            role_scores[role_id] = score
    
    # Sort by score
    suggested_roles = sorted(role_scores.items(), key=lambda x: x[1], reverse=True)
    top_roles = [r[0] for r in suggested_roles[:6]]
    
    # Fallback if nothing matched
    if not top_roles:
        if len(found_skills) > 5:
            top_roles = ["software_engineer", "data_analyst"]
        else:
            top_roles = ["software_engineer"]
    
    # Determine resume strength
    if len(found_skills) >= 15 and experience_years >= 2:
        strength = "strong"
        strength_score = 85
    elif len(found_skills) >= 8 or experience_years >= 1:
        strength = "moderate"
        strength_score = 60
    else:
        strength = "needs_improvement"
        strength_score = 35
    
    # Get PDF as base64 for frontend display
    pdf_base64 = get_pdf_as_base64(file_path)
    
    return {
        "contact_info": contact_info,
        "raw_text_preview": text[:1500],
        "skills_found": found_skills,
        "experience_years": experience_years,
        "education": education,
        "companies_worked": companies_worked,
        "suggested_roles": top_roles,
        "skill_count": len(found_skills),
        "resume_strength": strength,
        "strength_score": strength_score,
        "extraction_method": method_used,
        "ocr_used": method_used == "ocr",
        "pdf_base64": pdf_base64,
        "total_text_length": len(text)
    }
