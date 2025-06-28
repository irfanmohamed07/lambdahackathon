Absolutely Irfan! Here's a clear **Product Requirement Document (PRD)** — written for a **junior developer** — explaining your **LangChain + AWS Lambda SEO Blog Writer** system in **Node.js** terms, **without diving into code**.

---

# 📝 PRD: AI-Powered Blog Writer using LangChain + AWS Lambda

---

## 💡 Project Overview:

We’re building a **serverless AI system** that:

* Accepts a website URL (like Flipkart)
* Understands what the website is about
* Finds what **content is missing**
* Uses **AI (Gemini)** to write a full blog
* Publishes that blog to a **CMS (Sanity.io)**

All of this runs using **AWS Lambda (Node.js)** and **LangChain agents** — no backend server needed.

---

## 🎯 Goal:

Automate the entire **SEO blog creation pipeline** using:

* **LangChain agents**
* **Gemini & Perplexity**
* **AWS Lambda**
* **Sanity CMS**

---

## 🧑‍💻 Who is this for?

This is written for **junior Node.js developers** learning how to:

* Use Lambda functions
* Connect AI APIs like Gemini and Perplexity
* Work with headless CMS like Sanity
* Understand agent-based workflows with LangChain

---

## 🧱 System Architecture (Simple Explanation):

Each step of our system is like a mini machine (Lambda function) that does one task.

### Here’s how it works, step-by-step:

---

### 🔹 Step 1: Analyze Website

* User gives a URL: `https://flipkart.com`
* Lambda reads this and uses **LangChain + GPT** to understand what this website is about
  ✅ Output: "It’s an e-commerce website selling phones, fashion, etc."

---

### 🔹 Step 2: Competitor Research with Perplexity (Call 1)

* We ask Perplexity: "What are the most popular pages on flipkart.com?"
  ✅ Output: URLs like `flipkart.com/mobiles`, `flipkart.com/fashion`

---

### 🔹 Step 3: More Competitor Insight (Call 2)

* We ask again: "What kind of content is Flipkart publishing?"
  ✅ Output: Product specs, discounts, not much on “eco-friendly phones”

---

### 🔹 Step 4: Keyword Generation

* GPT generates 30 SEO keywords related to the site
  ✅ Example: `best budget phones`, `eco friendly mobiles`, `non-chinese smartphones`

---

### 🔹 Step 5: Keyword Clustering

* We group keywords into topics (clusters):
  ✅ Example Clusters: `Phones`, `Fashion`, `Electronics`

---

### 🔹 Step 6: Gap Analysis

* GPT + Google results show us what Flipkart is **not covering**
  ✅ Example: “Eco-Friendly Phones under ₹15K”

---

### 🔹 Step 7: Blog Outline Creation

* GPT generates a structure:
  ✅ Example: Intro, List of phones, Features, Conclusion

---

### 🔹 Step 8: Blog Writing using **3 Gemini agents**

* 3 parallel GPT (Gemini) agents write:

  * 📌 Intro
  * 📌 Main Content
  * 📌 Conclusion
    ✅ Result: Full blog ready in 3 parts

---

### 🔹 Step 9: Final Edit & Polish

* GPT improves grammar, SEO score, adds headings & metadata

---

### 🔹 Step 10: Publish to Sanity

* Content is uploaded to Sanity CMS
  ✅ Final blog URL is returned to the user

---

## 🧩 Tech Stack:

| Component        | Tool                            |
| ---------------- | ------------------------------- |
| Backend Logic    | AWS Lambda (Node.js)            |
| Agent Logic      | LangChain                       |
| AI Writing       | Gemini (via LangChain)          |
| Competitor Data  | Perplexity API                  |
| CMS              | Sanity.io                       |
| Optional Storage | (No DB needed, but S3 optional) |

---

## 🔗 Endpoint Flow:

```
Frontend (User enters URL)
   ↓
API Gateway
   ↓
Lambda 1: Analyze website
   ↓
Lambda 2: Perplexity search #1
   ↓
Lambda 3: Perplexity search #2
   ↓
Lambda 4: Generate keywords
   ↓
Lambda 5: Cluster keywords
   ↓
Lambda 6: Gap analysis
   ↓
Lambda 7: Outline creation
   ↓
Lambda 8: Write blog (Gemini - 3 calls)
   ↓
Lambda 9: Final edit
   ↓
Lambda 10: Publish to Sanity CMS
   ↓
Frontend shows blog link
```

---

## 🎁 Key Features:

* 🧠 Smart: Uses GPT + Gemini + Perplexity
* ⚡ Fast: Serverless with AWS Lambda
* 🧱 Modular: Each step is a separate Lambda
* 🌐 Publishes directly to a live CMS (Sanity)
* 🚫 No database needed (stateless system)

---

## 🛠️ Dev Tasks for Junior Developer:

| Task                                                 | Description                             |
| ---------------------------------------------------- | --------------------------------------- |
| \[ ] Set up AWS Lambda using Node.js                 | Use Serverless Framework or AWS Console |
| \[ ] Connect LangChain with GPT/Gemini               | Use LangChain modules                   |
| \[ ] Call Perplexity API                             | Use HTTP `fetch()`                      |
| \[ ] Generate keywords + clusters                    | GPT prompt chaining                     |
| \[ ] Send blog to Sanity CMS                         | Use their API with secret key           |
| \[ ] (Optional) Store progress in S3 or local memory |                                         |

---

## 🧪 Testing Strategy:

* Each Lambda function should be **independently testable**
* Simulate frontend by calling the Lambda with test inputs
* Use test blog like `https://example.com` to verify steps

---

## 🏁 Final Output:

* A full blog article like:
  👉 `https://blog.yourwebsite.com/top-eco-friendly-phones`

---

Would you like a **flowchart** or **Notion-style doc version** of this PRD to share with your team or upload to your hackathon repo?
