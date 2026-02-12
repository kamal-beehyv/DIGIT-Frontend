import React from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@egovernments/digit-ui-components";
import styles from "./VerifyOtherId.module.scss";

const VerifyOtherId = ({ stateCode, tenants, path }) => {
  const { t } = useTranslation();

  return (
    <div className={styles["verify-other-container"]}>
      <div className={styles["verify-other-content"]}>
        <Card className={styles["verify-other-card"]} noCardStyle>
          <h1 className={styles["verify-other-title"]}>
            {t("OTHER_ID_VERIFICATION")}
          </h1>
          <p className={styles["verify-other-message"]}>
            {t("OTHER_ID_COMING_SOON")}
          </p>
        </Card>
      </div>
    </div>
  );
};

export default VerifyOtherId;
