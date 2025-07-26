import { Bold, Button, Content, P, Template, Title } from '../components';

export type SetPasswordProps = {
  url: string;
};

export default function SetPassword(props: SetPasswordProps) {
  return (
    <Template>
      <Title>Set your Open-Agent password</Title>
      <Content>
        <P>
          Click the button below to set your password. The magic link will
          expire in <Bold>30 minutes</Bold>.
        </P>
        <Button href={props.url}>Sign in to Open-Agent</Button>
      </Content>
    </Template>
  );
}

SetPassword.PreviewProps = {
  url: 'https://app.open-agent.io',
};
