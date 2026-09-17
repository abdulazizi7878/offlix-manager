import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "../../components/layout/LanguageSwitcher";

export default async function TestI18nPage() {
    const t = await getTranslations("common");

    return (
        <main className="p-8">
            <h1 className="text-2xl font-bold">
                {t("hello")}
            </h1>

            <div className="mt-4 flex gap-3">
                <button>{t("save")}</button>
                <button>{t("cancel")}</button>
                <button>{t("delete")}</button>
                <LanguageSwitcher />

            </div>
        </main>
    );
}