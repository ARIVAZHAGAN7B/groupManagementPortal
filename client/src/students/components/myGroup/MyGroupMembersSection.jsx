import GroupMembersTable from "../../../admin/components/membership/GroupMembersTable";

export default function MyGroupMembersSection({
  currentStudentId,
  isCaptain = false,
  members,
  onChanged
}) {
  return (
    <div className="space-y-3">
   <GroupMembersTable
        members={members}
        canEditRole={isCaptain}
        canRemoveMember={isCaptain}
        canRemoveRow={(row) => String(row?.student_id) !== String(currentStudentId)}
        onChanged={onChanged}
        highlightStudentId={currentStudentId || null}
        showMembershipId={false}
      />
    </div>
  );
}
