import { Link } from "react-router-dom";
import StarRating from "../StarRating";
import AcademyImage from "./AcademyImage";
import { trackAcademyEvent } from "../../utils/academyApi";

function isPhotoImage(src = "") {
  return /\.(jpe?g|png|webp)$/i.test(src);
}

export default function CourseCard({ course, rating }) {
  const average = rating?.averageRating || 0;
  const count = rating?.ratingCount || 0;
  const photo = isPhotoImage(course.image);

  return (
    <article className="lift h-full flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className={`relative aspect-[16/10] overflow-hidden ${photo ? "bg-white" : "bg-[#00274c]"}`}>
        <AcademyImage
          src={course.image}
          alt={course.imageAlt || course.title}
          className={`w-full h-full ${photo ? "object-contain" : "object-cover"}`}
        />
        <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#00274c]">
          {course.code}
        </span>
      </div>
      <div className="flex flex-col flex-1 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#c10020]">{course.category}</p>
        <h3 className="mt-1 font-display font-bold text-[#00274c] text-lg leading-snug line-clamp-2 min-h-[3.2rem]">
          {course.title}
        </h3>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{course.level}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{course.duration}</span>
          <span className="rounded-full bg-[#00274c]/5 px-2.5 py-1 font-semibold text-[#00274c]">
            US${course.tuition}
            {course.registrationFee ? ` + $${course.registrationFee} reg.` : ""}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 min-h-[1.25rem]">
          {count > 0 ? (
            <>
              <StarRating count={Math.round(average)} size={14} />
              <span className="text-xs text-slate-500">
                {average.toFixed(1)} ({count} rating{count === 1 ? "" : "s"})
              </span>
            </>
          ) : (
            <span className="text-xs font-medium text-slate-400">No ratings yet</span>
          )}
        </div>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed line-clamp-3 flex-1">
          {course.description}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link
            to={`/academy/courses/${course.slug}`}
            onClick={() => trackAcademyEvent("course_view", { course: course.code })}
            className="btn-outline !py-2.5 !text-xs text-center"
          >
            View Details
          </Link>
          <Link
            to={`/academy/enroll?course=${encodeURIComponent(course.code)}`}
            onClick={() => trackAcademyEvent("enroll_click", { course: course.code, source: "card" })}
            className="btn-primary !py-2.5 !text-xs text-center"
          >
            Enroll Now
          </Link>
        </div>
      </div>
    </article>
  );
}
