import type TestLdapConnectionRepresentation from "@keycloak/keycloak-admin-client/lib/defs/testLdapConnection";
import {
  HelpItem,
  KeycloakSelect,
  PasswordControl,
  SelectControl,
  SelectVariant,
  TextControl,
} from "@keycloak/keycloak-ui-shared";
import {
  AlertVariant,
  Button,
  FormGroup,
  SelectOption,
  Switch,
} from "@patternfly/react-core";
import { get, isEqual } from "lodash-es";
import { useState } from "react";
import {
  Controller,
  FormProvider,
  UseFormReturn,
  useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAdminClient } from "../../admin-client";
import { useAlerts } from "@keycloak/keycloak-ui-shared";
import { FormAccess } from "../../components/form/FormAccess";
import { WizardSectionHeader } from "../../components/wizard-section-header/WizardSectionHeader";
import { useRealm } from "../../context/realm-context/RealmContext";

export type LdapSettingsPasswordChangeProps = {
  form: UseFormReturn;
  id?: string;
  showSectionHeading?: boolean;
  showSectionDescription?: boolean;
};

const testLdapConnectionProperties: Array<
  keyof TestLdapConnectionRepresentation
> = ["connectionUrl", "useTruststoreSpi", "connectionTimeout", "startTls"];

const testLdapBindProperties: Array<keyof TestLdapConnectionRepresentation> = [
  "bindDn",
  "bindCredential",
  "authType",
];

type TestTypes = "testConnection" | "testAuthentication";

export const convertFormToSettings = (form: UseFormReturn) => {
  const settings: TestLdapConnectionRepresentation = {};
  let suffix: string;

  suffix =
    get(form.getValues(), "config.connectionUrlPwdChange.0") === ""
      ? ""
      : "PwdChange";
  testLdapConnectionProperties.forEach((key) => {
    const value = get(form.getValues(), `config.${key + suffix}`);
    settings[key] = Array.isArray(value) ? value[0] : "";
  });

  if (get(form.getValues(), "config.authTypePwdChange.0") === "simple") {
    suffix =
      get(form.getValues(), "config.bindDnPwdChange.0") === ""
        ? ""
        : "PwdChange";
    testLdapBindProperties.forEach((key) => {
      const value = get(form.getValues(), `config.${key + suffix}`);
      settings[key] = Array.isArray(value) ? value[0] : "";
    });
  }

  return settings;
};

export const LdapSettingsPasswordChange = ({
  form,
  id,
  showSectionHeading = false,
  showSectionDescription = false,
}: LdapSettingsPasswordChangeProps) => {
  const { adminClient } = useAdminClient();

  const { t } = useTranslation();
  const { realm } = useRealm();
  const { addAlert, addError } = useAlerts();
  const edit = !!id;

  const testLdap = async (testType: TestTypes) => {
    try {
      const settings = convertFormToSettings(form);
      await adminClient.realms.testLDAPConnection(
        { realm },
        { ...settings, action: testType, componentId: id },
      );
      addAlert(t("testSuccess"), AlertVariant.success);
    } catch (error) {
      addError("testError", error);
    }
  };

  const [isBindTypeDropdownOpen, setIsBindTypeDropdownOpen] = useState(false);

  const [isUsePasswordFormatDropdownOpen, setUsePasswordFormatDropdownOpen] = useState(false);

  const [isUsePasswordChangeTimeFormatDropdownOpen, setUsePasswordChangeTimeFormatDropdownOpen] = useState(false);

  const usePasswordChangeSettings: [string] = useWatch({
    control: form.control,
    name: "config.usePasswordChangeSettings",
    defaultValue: ["false"],
  });

  const connectionUrlPwdChange: [string] = useWatch({
    control: form.control,
    name: "config.connectionUrlPwdChange",
    defaultValue: [""],
  });

  const bindDnPwdChange: [string] = useWatch({
    control: form.control,
    name: "config.bindDnPwdChange",
    defaultValue: [""],
  });

  const ldapBindType = useWatch({
    control: form.control,
    name: "config.authTypePwdChange",
    defaultValue: ["simple"],
  });

  const passwordChangeTimeAttr: [string] = useWatch({
    control: form.control,
    name: "config.passwordChangeTimeAttr",
    defaultValue: [""],
  });

  const usePasswordRFC2617: [string] = useWatch({
    control: form.control,
    name: "config.useRFC2617Attr",
    defaultValue: ["false"],
  });

  return (
    <FormProvider {...form}>
      {showSectionHeading && (
        <WizardSectionHeader
          title={t("passwordChangeSettings")}
          description={t("ldapPpasswordChangeSettingsDescription")}
          showDescription={showSectionDescription}
        />
      )}
      <FormAccess role="manage-realm" isHorizontal>
        <FormGroup
          label={t("usePasswordChangeSettings")}
          labelIcon={
            <HelpItem
              helpText={t("usePasswordChangeSettingsHelp")}
              fieldLabelId="usePasswordChangeSettings"
            />
          }
          fieldId="kc-use-pwd-change-settings"
          hasNoPaddingTop
        >
          <Controller
            name="config.usePasswordChangeSettings"
            defaultValue={["false"]}
            control={form.control}
            render={({ field }) => (
              <Switch
                id="kc-use-pwd-change-settings"
                data-testid="use-pwd-change-settings"
                isDisabled={false}
                onChange={(_event, value) => field.onChange([`${value}`])}
                isChecked={field.value[0] === "true"}
                label={t("on")}
                labelOff={t("off")}
                aria-label={t("usePasswordChangeSettings")}
              />
            )}
          />
        </FormGroup>
        {usePasswordChangeSettings[0] === "true" && (
          <>
            <TextControl
              name="config.connectionUrlPwdChange.0"
              label={t("connectionURL")}
              labelIcon={t("consoleDisplayConnectionUrlHelp")}
              type="url"
              placeholder={t("consoleDisplayConnectionUrlHolder")}
            />
            {connectionUrlPwdChange[0] !== "" && (
              <>
                <FormGroup
                  label={t("enableStartTls")}
                  labelIcon={
                    <HelpItem
                      helpText={t("enableStartTlsHelp")}
                      fieldLabelId="enableStartTlsPwdChange"
                    />
                  }
                  fieldId="kc-enable-start-tls-pwd-change"
                  hasNoPaddingTop
                >
                  <Controller
                    name="config.startTlsPwdChange"
                    defaultValue={["false"]}
                    control={form.control}
                    render={({ field }) => (
                      <Switch
                        id={"kc-enable-start-tls-pwd-change"}
                        data-testid="enable-start-tls-pwd-change"
                        isDisabled={false}
                        onChange={(_event, value) =>
                          field.onChange([`${value}`])
                        }
                        isChecked={field.value[0] === "true"}
                        label={t("on")}
                        labelOff={t("off")}
                        aria-label={t("enableStartTls")}
                      />
                    )}
                  />
                </FormGroup>
                <SelectControl
                  id="useTruststoreSpiPwdChange"
                  name="config.useTruststoreSpiPwdChange.0"
                  label={t("useTruststoreSpi")}
                  labelIcon={t("useTruststoreSpiHelp")}
                  controller={{
                    defaultValue: "always",
                  }}
                  options={[
                    { key: "always", value: t("always") },
                    { key: "never", value: t("never") },
                  ]}
                />
                <FormGroup
                  label={t("connectionPooling")}
                  labelIcon={
                    <HelpItem
                      helpText={t("connectionPoolingHelp")}
                      fieldLabelId="connectionPoolingPwdChange"
                    />
                  }
                  fieldId="kc-connection-pooling-pwd-change"
                  hasNoPaddingTop
                >
                  <Controller
                    name="config.connectionPoolingPwdChange"
                    defaultValue={["true"]}
                    control={form.control}
                    render={({ field }) => (
                      <Switch
                        id={"kc-connection-pooling-pwd-change"}
                        data-testid="connection-pooling-pwd-change"
                        isDisabled={false}
                        onChange={(_event, value) =>
                          field.onChange([`${value}`])
                        }
                        isChecked={field.value[0] === "true"}
                        label={t("on")}
                        labelOff={t("off")}
                        aria-label={t("connectionPooling")}
                      />
                    )}
                  />
                </FormGroup>
                <TextControl
                  name="config.connectionTimeoutPwdChange.0"
                  label={t("connectionTimeout")}
                  labelIcon={t("connectionTimeoutHelp")}
                  type="number"
                  min={0}
                />
                <FormGroup fieldId="kc-test-connection-button-pwd-change">
                  <Button
                    variant="secondary"
                    id="kc-test-connection-button-pwd-change"
                    data-testid="test-connection-button-pwd-change"
                    onClick={() => testLdap("testConnection")}
                  >
                    {t("testConnection")}
                  </Button>
                </FormGroup>
              </>
            )}
            <FormGroup
              label={t("bindType")}
              labelIcon={
                <HelpItem
                  helpText={t("bindTypeHelp")}
                  fieldLabelId="bindTypePwdChange"
                />
              }
              fieldId="kc-bind-type-pwd-change"
              isRequired
            >
              <Controller
                name="config.authTypePwdChange.0"
                defaultValue="simple"
                control={form.control}
                render={({ field }) => (
                  <KeycloakSelect
                    toggleId="kc-bind-type-pwd-change"
                    onToggle={() =>
                      setIsBindTypeDropdownOpen(!isBindTypeDropdownOpen)
                    }
                    isOpen={isBindTypeDropdownOpen}
                    onSelect={(value) => {
                      field.onChange(value as string);
                      setIsBindTypeDropdownOpen(false);
                    }}
                    selections={field.value}
                    variant={SelectVariant.single}
                    data-testid="ldap-bind-type-pwd-change"
                    aria-label={t("selectBindType")}
                  >
                    <SelectOption value="simple">simple</SelectOption>
                    <SelectOption value="none">none</SelectOption>
                  </KeycloakSelect>
                )}
              />
            </FormGroup>
            {isEqual(ldapBindType, ["simple"]) && (
              <>
                <TextControl
                  name="config.bindDnPwdChange.0"
                  label={t("bindDn")}
                  labelIcon={t("bindDnHelp")}
                  placeholder={t("bindDnHolder")}
                />
                {bindDnPwdChange[0] !== "" && (
                  <PasswordControl
                    name="config.bindCredentialPwdChange.0"
                    label={t("bindCredentials")}
                    labelIcon={t("bindCredentialsHelp")}
                    hasReveal={!edit}
                  />
                )}
              </>
            )}
            <FormGroup fieldId="kc-test-auth-button-pwd-change">
              <Button
                variant="secondary"
                id="kc-test-auth-button-pwd-change"
                data-testid="test-auth-button-pwd-change"
                onClick={() => testLdap("testAuthentication")}
              >
                {t("testAuthentication")}
              </Button>
            </FormGroup>
            <FormGroup
              label={t("usePasswordFormat")}
              labelIcon={
                <HelpItem
                  helpText={t("usePasswordFormatHelp")}
                  fieldLabelId="usePasswordFormat"
                />
              }
              fieldId="kc-use-password-format"
            >
              <Controller
                name="config.passwordHashingFormat.0"
                defaultValue="plain"
                control={form.control}
                render={({ field }) => (
                  <KeycloakSelect
                    toggleId="kc-use-password-format"
                    onToggle={() =>
                      setUsePasswordFormatDropdownOpen(
                        !isUsePasswordFormatDropdownOpen,
                      )
                    }
                    isOpen={isUsePasswordFormatDropdownOpen}
                    onSelect={(value) => {
                      field.onChange(value as string);
                      setUsePasswordFormatDropdownOpen(false);
                    }}
                    selections={field.value}
                    variant={SelectVariant.single}
                    data-testid="use-password-format"
                    aria-label={t("selectusePasswordFormat")}
                  >
                    <SelectOption value="plain">{t("plainText")}</SelectOption>
                    <SelectOption value="md5">MD5</SelectOption>
                    <SelectOption value="smd5">SMD5</SelectOption>
                    <SelectOption value="sha">SHA</SelectOption>
                    <SelectOption value="ssha">SSHA</SelectOption>
                    <SelectOption value="ssha256">SSHA256</SelectOption>
                    <SelectOption value="sha3_256">SSHA3_256</SelectOption>
                  </KeycloakSelect>
                )}
              />
            </FormGroup>
            <TextControl
              name="config.passwordChangeTimeAttr.0"
              label={t("usePasswordChangeTimeAttr")}
              labelIcon={t("usePasswordChangeTimeAttr")}
              type="text"
            />
            {passwordChangeTimeAttr[0] !== "" && (
              <FormGroup
                label={t("usePasswordChangeTimeFormat")}
                labelIcon={
                  <HelpItem
                    helpText={t("usePasswordChangeTimeFormatHelp")}
                    fieldLabelId="usePasswordChangeTimeFormat"
                  />
                }
                fieldId="kc-use-password-change-time-format"
              >
                <Controller
                  name="config.passwordChangeTimeFormat.0"
                  defaultValue="generalizedtime"
                  control={form.control}
                  render={({ field }) => (
                    <KeycloakSelect
                      toggleId="kc-use-password-change-time-format"
                      onToggle={() =>
                        setUsePasswordChangeTimeFormatDropdownOpen(
                          !isUsePasswordChangeTimeFormatDropdownOpen,
                        )
                      }
                      isOpen={isUsePasswordChangeTimeFormatDropdownOpen}
                      onSelect={(value) => {
                        field.onChange(value as string);
                        setUsePasswordChangeTimeFormatDropdownOpen(false);
                      }}
                      selections={field.value}
                      variant={SelectVariant.single}
                      data-testid="use-password-change-time-format"
                      aria-label={t("selectUsePasswordChangeTimeFormat")}
                    >
                      <SelectOption value="generalizedtime">
                        {t("generalizedTimeToDate")}
                      </SelectOption>
                      <SelectOption value="winnt">
                        {t("windowsNTtimeFormat")}
                      </SelectOption>
                      <SelectOption value="unix">
                        {t("unixTimestamp")}
                      </SelectOption>
                      <SelectOption value="unixms">
                        {t("unixTimestampMS")}
                      </SelectOption>
                    </KeycloakSelect>
                  )}
                />
              </FormGroup>
            )}
            <FormGroup
              label={t("usePasswordSAMBA")}
              labelIcon={
                <HelpItem
                  helpText={t("usePasswordSAMBAHelp")}
                  fieldLabelId="usePasswordSAMBA"
                />
              }
              fieldId="kc-use-password-samba"
              hasNoPaddingTop
            >
              <Controller
                name="config.useSambaAttrs"
                defaultValue={["false"]}
                control={form.control}
                render={({ field }) => (
                  <Switch
                    id="kc-use-password-samba"
                    data-testid="use-password-samba"
                    isDisabled={false}
                    onChange={(_event, value) => field.onChange([`${value}`])}
                    isChecked={field.value[0] === "true"}
                    label={t("on")}
                    labelOff={t("off")}
                    aria-label={t("usePasswordSAMBA")}
                  />
                )}
              />
            </FormGroup>
            <FormGroup
              label={t("usePasswordRFC2617")}
              labelIcon={
                <HelpItem
                  helpText={t("usePasswordRFC2617Help")}
                  fieldLabelId="usePasswordRFC2617"
                />
              }
              fieldId="kc-use-password-rfc2617"
              hasNoPaddingTop
            >
              <Controller
                name="config.useRFC2617Attr"
                defaultValue={["false"]}
                control={form.control}
                render={({ field }) => (
                  <Switch
                    id="kc-use-password-rfc2617"
                    data-testid="use-password-rfc2617"
                    isDisabled={false}
                    onChange={(_event, value) => field.onChange([`${value}`])}
                    isChecked={field.value[0] === "true"}
                    label={t("on")}
                    labelOff={t("off")}
                    aria-label={t("usePasswordRFC2617")}
                  />
                )}
              />
            </FormGroup>
            {usePasswordRFC2617[0] === "true" && (
              <TextControl
                name="config.RFC2617Realm.0"
                label={t("realmPasswordRFC2617")}
                labelIcon={t("realmPasswordRFC2617Help")}
                placeholder={t("realmPasswordRFC2617Placeholder")}
                type="text"
              />
            )}
          </>
        )}
      </FormAccess>
    </FormProvider>
  );
};
