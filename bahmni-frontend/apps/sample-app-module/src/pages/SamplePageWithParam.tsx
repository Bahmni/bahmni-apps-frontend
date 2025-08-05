import { useParams } from 'react-router-dom';


export const SampleParamPage: React.FC = () => {
    const { param } = useParams<{ param: string }>();
    return (
        <div>
            <h1>Sample Param Page</h1>
            <p>This is a sample page in Bahmni App with Param.</p>
            <p>Param Value: {param}</p>
        </div>
    );
};