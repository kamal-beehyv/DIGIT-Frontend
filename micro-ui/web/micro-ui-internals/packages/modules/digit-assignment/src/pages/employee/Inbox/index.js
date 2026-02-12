import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, SearchBar, Loader } from "@egovernments/digit-ui-components";
import { Table } from "@egovernments/digit-ui-react-components";
import { searchAdvocates } from "../../../services/AdvocateService";
import { searchWorkflow } from "../../../services/WorkflowService";
import styles from "./Inbox.module.scss";

const Inbox = ({ stateCode, tenants }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tenantId = stateCode || tenants?.[0]?.code || "dev";
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [filteredApplications, setFilteredApplications] = useState([]);

  useEffect(() => {
    fetchApplications();
  }, [tenantId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // Fetch all advocates with workflow status "User Registration Requested"
      const advocateResponse = await searchAdvocates({ tenantId }, tenantId);
      const advocates = advocateResponse?.advocates || [];
      
      // Fetch workflow data for each advocate
      const applicationsWithWorkflow = await Promise.all(
        advocates.map(async (advocate) => {
          try {
            const workflowResponse = await searchWorkflow(
              {
                tenantId: tenantId,
                businessIds: [advocate.applicationNumber],
                businessService: "AdvocateRegistration"
              },
              tenantId
            );
            
            const workflow = workflowResponse?.ProcessInstances?.[0];
            const state = workflow?.state?.state || advocate.workflow?.state?.state || "User Registration Requested";
            
            // Calculate "Due Since" (time pending)
            const createdTime = workflow?.createdTime || advocate.auditDetails?.createdTime || Date.now();
            const dueSince = Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24)); // days
            
            // Get user details
            const userName = advocate.individualId 
              ? await getUserName(advocate.individualId, tenantId)
              : "N/A";
            
            return {
              ...advocate,
              userName: userName,
              state: state,
              dueSince: dueSince,
              createdTime: createdTime
            };
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error("Error fetching workflow for advocate:", error);
            }
            return {
              ...advocate,
              userName: "N/A",
              state: "User Registration Requested",
              dueSince: 0,
              createdTime: Date.now()
            };
          }
        })
      );
      
      // Filter only pending applications and sort by Due Since (longest pending first)
      const pendingApplications = applicationsWithWorkflow
        .filter(app => app.state === "User Registration Requested")
        .sort((a, b) => b.dueSince - a.dueSince);
      
      setApplications(pendingApplications);
      setFilteredApplications(pendingApplications);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching applications:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getUserName = async (individualId, tenantId) => {
    try {
      const response = await Digit.CustomService.getResponse({
        url: "/individual/v1/_search",
        body: {
          criteria: [{ id: individualId }]
        },
        method: "POST"
      });
      
      if (response?.individuals && response.individuals.length > 0) {
        const individual = response.individuals[0];
        const name = individual.name;
        return `${name?.givenName || ""} ${name?.familyName || ""}`.trim() || "N/A";
      }
      return "N/A";
    } catch (error) {
      return "N/A";
    }
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    if (!value || value.trim() === "") {
      setFilteredApplications(applications);
      return;
    }
    
    const searchTerm = value.toLowerCase();
    const filtered = applications.filter(app => {
      const appNumber = app.applicationNumber?.toLowerCase() || "";
      const userName = app.userName?.toLowerCase() || "";
      const userType = app.advocateType?.toLowerCase() || "";
      
      return appNumber.includes(searchTerm) || 
             userName.includes(searchTerm) || 
             userType.includes(searchTerm);
    });
    
    setFilteredApplications(filtered);
  };

  const handleRowClick = (row) => {
    navigate(`/${window?.contextPath}/employee/digit-assignment/application/${row.original.id}`);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const formatDueSince = (days) => {
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  const getUserTypeDisplay = (advocateType) => {
    if (advocateType === "ADVOCATE_CLERK") return "Advocate Clerk";
    return "Advocate";
  };

  const tableColumns = useMemo(() => [
    {
      Header: t("APPLICATION_ID") || "Application ID",
      accessor: "applicationNumber",
      disableSortBy: false
    },
    {
      Header: t("USER_NAME") || "User Name",
      accessor: "userName",
      disableSortBy: false
    },
    {
      Header: t("USER_TYPE") || "User Type",
      accessor: (row) => getUserTypeDisplay(row.advocateType),
      disableSortBy: false
    },
    {
      Header: t("DATE_CREATED") || "Date Created",
      accessor: (row) => formatDate(row.createdTime),
      disableSortBy: false
    },
    {
      Header: t("DUE_SINCE") || "Due Since",
      accessor: (row) => formatDueSince(row.dueSince),
      disableSortBy: false,
      sortType: (rowA, rowB) => {
        return rowA.original.dueSince - rowB.original.dueSince;
      }
    }
  ], [t]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className={`advocate-registration-inbox ${styles["inbox-container"]}`}>
      <Card>
        <div className={styles["header-section"]}>
          <h2 className={styles["inbox-title"]}>{t("ADVOCATE_REGISTRATION_INBOX")}</h2>
          <SearchBar
            onChange={handleSearch}
            value={searchValue}
            placeholder={t("SEARCH_APPLICATIONS") || "Search by Application ID, User Name, or User Type"}
            tabIndex={0}
            aria-label={t("SEARCH_APPLICATIONS") || "Search applications"}
          />
        </div>
        
        {filteredApplications.length === 0 ? (
          <div className={styles["empty-state"]}>
            <p>{t("NO_APPLICATIONS_FOUND") || "No pending applications found"}</p>
          </div>
        ) : (
          <Table
            t={t}
            data={filteredApplications}
            columns={tableColumns}
            manualPagination={false}
            disableSort={false}
            autoSort={true}
            initSortId="DUE_SINCE"
            globalSearch={searchValue}
            onSearch={handleSearch}
            totalRecords={filteredApplications.length}
            onClickRow={handleRowClick}
            getCellProps={(cellInfo) => ({
              className: styles["table-cell"]
            })}
          />
        )}
      </Card>
    </div>
  );
};

export default Inbox;
