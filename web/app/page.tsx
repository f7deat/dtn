/* eslint-disable @next/next/no-img-element */
import { faFlag } from "@fortawesome/free-regular-svg-icons";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "dayjs";
import Link from "next/link";
import { apiArticleList } from "./services/article";

export default async function Home() {

  const response = await apiArticleList({ current: 1, pageSize: 4 });
  const articles = response.data.data;

  return (
    <main>
      <div className="container mx-auto py-8 md:py-20 px-4 md:px-0">
        <div className="text-center mb-4 2xl:mb-8">
          <div className="text-sm text-red-700 font-bold uppercase"><FontAwesomeIcon icon={faFlag} className="w-3 h-3 inline" /> News - Event</div>
          <div className="text-3xl md:text-4xl font-bold mt-2">
            Tin tức & Sự kiện
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {
            articles.map((article: API.ArticleListItem) => (
              <div key={article.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="relative">
                  <div className="h-48 md:h-52 bg-black">
                    <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover hover:opacity-75 transition duration-500" />
                  </div>
                  <div className="absolute bottom-0 left-0 bg-red-600 text-white w-20 flex flex-col items-center justify-center py-2 font-bold">
                    <span>{dayjs(article.createdDate).format("MMM")}</span>
                    <span>{dayjs(article.createdDate).format("DD")},</span>
                    <span>{dayjs(article.createdDate).format("YYYY")}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-2 line-clamp-2">
                    <Link href={`/article/${article.normalizedName}`} className="text-lg font-bold hover:text-red-600">
                      {article.title}
                    </Link>
                  </div>
                  <Link href={`/article/${article.normalizedName}`} className="text-red-600 hover:underline text-sm font-bold">
                    Xem chi tiết <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3 inline" />
                  </Link>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </main>
  );
}
