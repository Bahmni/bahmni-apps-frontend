import { useParams } from 'react-router-dom';


export const SamplePatientPage: React.FC = () => {
    const { patientUuid } = useParams<{ patientUuid: string }>();
    return (
        <div>
            <h1>Sample Patient Page</h1>
            <p>This is a sample patient page in the Bahmni Sample app.</p>
            <p>Patient UUID: {patientUuid}</p>
        </div>
    );
}