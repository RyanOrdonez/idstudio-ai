'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Blog() {
  const blogPosts = [
    {
      id: 1,
      title: "The Future of AI in Interior Design",
      excerpt: "Discover how artificial intelligence is revolutionizing the interior design industry and what it means for designers and clients.",
      author: "Sarah Johnson",
      date: "December 15, 2024",
      readTime: "5 min read",
      category: "AI & Technology",
      image: "/api/placeholder/400/250"
    },
    {
      id: 2,
      title: "10 Essential Tools Every Interior Designer Needs",
      excerpt: "From measurement apps to color palette generators, here are the must-have tools for modern interior designers.",
      author: "Michael Chen",
      date: "December 10, 2024",
      readTime: "8 min read",
      category: "Tools & Resources",
      image: "/api/placeholder/400/250"
    },
    {
      id: 3,
      title: "Client Communication Best Practices",
      excerpt: "Learn how to maintain clear, professional communication with clients throughout your design projects.",
      author: "Emma Rodriguez",
      date: "December 5, 2024",
      readTime: "6 min read",
      category: "Business Tips",
      image: "/api/placeholder/400/250"
    },
    {
      id: 4,
      title: "Sustainable Design Trends for 2025",
      excerpt: "Explore the latest eco-friendly design trends that are shaping the future of interior spaces.",
      author: "David Park",
      date: "November 28, 2024",
      readTime: "7 min read",
      category: "Design Trends",
      image: "/api/placeholder/400/250"
    },
    {
      id: 5,
      title: "Building Your Design Portfolio",
      excerpt: "Tips and strategies for creating a compelling portfolio that showcases your design expertise.",
      author: "Lisa Thompson",
      date: "November 20, 2024",
      readTime: "9 min read",
      category: "Career Development",
      image: "/api/placeholder/400/250"
    },
    {
      id: 6,
      title: "Color Psychology in Interior Design",
      excerpt: "Understanding how colors affect mood and behavior to create more impactful design solutions.",
      author: "James Wilson",
      date: "November 15, 2024",
      readTime: "6 min read",
      category: "Design Theory",
      image: "/api/placeholder/400/250"
    }
  ]

  const categories = ["All", "AI & Technology", "Tools & Resources", "Business Tips", "Design Trends", "Career Development", "Design Theory"]

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">Design Insights Blog</h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Stay updated with the latest trends, tips, and insights in interior design and AI technology.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === "All" 
                  ? "bg-blue-600 text-white" 
                  : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        <div className="mb-16">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2">
                <div className="h-64 md:h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="text-sm opacity-75">Featured Article</p>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 p-8">
                <div className="flex items-center mb-4">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Featured
                  </span>
                  <span className="ml-3 text-sm text-neutral-500">AI & Technology</span>
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                  The Future of AI in Interior Design
                </h2>
                <p className="text-neutral-600 mb-6">
                  Discover how artificial intelligence is revolutionizing the interior design industry and what it means for designers and clients. From automated space planning to personalized design recommendations.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-neutral-500">
                    <span>Sarah Johnson</span>
                    <span className="mx-2">•</span>
                    <span>December 15, 2024</span>
                    <span className="mx-2">•</span>
                    <span>5 min read</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    Read More →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.slice(1).map((post) => (
            <article key={post.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-48 bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                <div className="text-center text-neutral-500">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs">Article Image</p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-3">
                  <span className="bg-neutral-100 text-neutral-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {post.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <div className="flex items-center">
                    <span>{post.author}</span>
                    <span className="mx-2">•</span>
                    <span>{post.date}</span>
                  </div>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Load More Articles
          </button>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Stay Updated</h2>
          <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
            Subscribe to our newsletter to get the latest design insights, AI updates, and industry trends delivered to your inbox.
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
