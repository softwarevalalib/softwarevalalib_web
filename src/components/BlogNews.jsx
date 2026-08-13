import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import Reveal from "../Animations/Reveal";
import project1 from "../visuals/project1.jpg";
import project2 from "../visuals/project2.jpg";
import project3 from "../visuals/project3.jpg";
import project4 from "../visuals/project4.jpg";

const POSTS = [
  {
    id: 1,
    date: "September 6, 2024",
    category: "Web Development",
    title: "Importers achieve savings through the First Sale rule!",
    img: project1,
    excerpt: "How smart customs software is helping Liberian importers cut costs and speed up clearance.",
  },
  {
    id: 2,
    date: "September 6, 2024",
    category: "Case Study",
    title: "Transid Named a Finalist For Year'25 Best Choice Award",
    img: project2,
    excerpt: "Our transport & logistics platform earns regional recognition for innovation.",
  },
  {
    id: 3,
    date: "August 28, 2024",
    category: "Digital Marketing",
    title: "5 SEO habits every Liberian business should build in 2025",
    img: project3,
    excerpt: "Practical, low-cost steps to rank higher on Google and reach more local customers.",
  },
  {
    id: 4,
    date: "August 15, 2024",
    category: "Productivity",
    title: "Why schools are switching to cloud-based management systems",
    img: project4,
    excerpt: "The shift from paper to platforms — and what it means for administrators and parents.",
  },
];

/**
 * Digtek-style blog/news grid.
 */
export default function BlogNews() {
  return (
    <section className="section-padding bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="section-container">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <span className="eyebrow">News & Insights</span>
            <h2 className="section-heading mt-3">
              Latest from our <span className="accent">Blog</span>
            </h2>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {POSTS.map((post, i) => (
            <Reveal key={post.id} delay={i * 0.08}>
              <article className="lift h-full rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={post.img}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 text-xs font-semibold bg-orange-500 text-white px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-xs text-slate-400 font-medium">{post.date}</p>
                  <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2 flex-1">
                    {post.excerpt}
                  </p>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors group"
                  >
                    Read More
                    <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
